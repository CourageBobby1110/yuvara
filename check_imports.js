try {
  require("sonner");
  console.log("sonner found");
} catch (e) {
  console.log("sonner NOT found: " + e.message);
}

try {
  require("date-fns");
  console.log("date-fns found");
} catch (e) {
  console.log("date-fns NOT found: " + e.message);
}

try {
  require("clsx");
  console.log("clsx found");
} catch (e) {
  console.log("clsx NOT found: " + e.message);
}

try {
  require("tailwind-merge");
  console.log("tailwind-merge found");
} catch (e) {
  console.log("tailwind-merge NOT found: " + e.message);
}
