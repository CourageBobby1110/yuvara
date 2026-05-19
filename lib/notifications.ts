import admin from "./firebase-admin";
import User from "@/models/User";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Sends a push notification to a specific user by querying all their registered tokens.
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: user.fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Clean up expired/invalid tokens from DB
    if (response.failureCount > 0) {
      const tokensToRemove: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            tokensToRemove.push(user.fcmTokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: tokensToRemove } },
        });
        console.log(`Cleaned up ${tokensToRemove.length} expired FCM tokens for user ${userId}.`);
      }
    }

    console.log(`Push notifications sent successfully. Success: ${response.successCount}, Failures: ${response.failureCount}`);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Sends a multicast push notification to all users who have registered tokens.
 * Useful for broad promotions, daily deals, new arrivals.
 */
export async function sendBroadcastPushNotification(payload: PushPayload) {
  try {
    // Retrieve all users who have at least one registered FCM token
    const users = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } });
    if (!users || users.length === 0) {
      console.log("No users with registered FCM tokens found.");
      return;
    }

    // Collect all tokens and map them to their userIds for cleanup later if they fail
    const tokenToUserMap: Record<string, string> = {};
    const allTokens: string[] = [];

    users.forEach((user) => {
      user.fcmTokens.forEach((token: string) => {
        allTokens.push(token);
        tokenToUserMap[token] = user._id.toString();
      });
    });

    if (allTokens.length === 0) {
      return;
    }

    console.log(`Sending broadcast push notification to ${allTokens.length} devices...`);

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: allTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up expired/invalid tokens
    if (response.failureCount > 0) {
      const expiredTokensByUser: Record<string, string[]> = {};

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            const token = allTokens[idx];
            const userId = tokenToUserMap[token];
            if (userId) {
              if (!expiredTokensByUser[userId]) {
                expiredTokensByUser[userId] = [];
              }
              expiredTokensByUser[userId].push(token);
            }
          }
        }
      });

      // Execute pull requests in parallel
      const cleanupPromises = Object.entries(expiredTokensByUser).map(([userId, tokens]) =>
        User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: tokens } },
        })
      );
      await Promise.all(cleanupPromises);
      console.log(`Cleaned up broadcast errors. Removed expired tokens across ${cleanupPromises.length} users.`);
    }

    console.log(`Broadcast success: ${response.successCount}, failures: ${response.failureCount}`);
  } catch (error) {
    console.error("Error sending broadcast push notification:", error);
  }
}
