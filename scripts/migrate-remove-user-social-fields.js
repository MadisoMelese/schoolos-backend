/**
 * One-time migration: remove legacy following / savedPosts from User documents.
 * Requires MONGO_URI in .env (same as the API). Safe to re-run (idempotent).
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.model.js";
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.error("MONGO_URI is not set.");
    process.exit(1);
}
const run = async () => {
    await mongoose.connect(mongoUri);
    const result = await User.updateMany({
        $or: [
            { following: { $exists: true } },
            { savedPosts: { $exists: true } },
        ],
    }, { $unset: { following: "", savedPosts: "" } });
    console.log(`Matched ${result.matchedCount} user(s), modified ${result.modifiedCount}.`);
    await mongoose.disconnect();
};
run().catch((err) => {
    console.error(err);
    void mongoose.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-remove-user-social-fields.js.map