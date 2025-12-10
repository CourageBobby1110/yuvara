import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await auth();
      console.log(
        "UploadThing Middleware - Session:",
        session?.user?.email,
        session?.user?.role
      );

      // If you throw, the user will not be able to upload
      if (!session || session.user?.role !== "admin") {
        console.error("UploadThing Middleware - Unauthorized");
        throw new Error("Unauthorized");
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
  videoUploader: f({ video: { maxFileSize: "512MB", maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      console.log("[VideoUploader] Middleware started");
      const session = await auth();
      console.log(
        "[VideoUploader] Session:",
        session?.user?.email,
        session?.user?.role
      );

      if (!session) {
        console.error("[VideoUploader] No session found");
        throw new Error("Unauthorized: No session");
      }
      if (session.user?.role !== "admin") {
        console.error("[VideoUploader] User is not admin:", session.user?.role);
        throw new Error("Unauthorized: Not admin");
      }

      return { userId: session.user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Video upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
