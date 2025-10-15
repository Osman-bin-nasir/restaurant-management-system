import mongoose from "mongoose";
import dotenv from "dotenv";
import Permission from "../models/Permissions.js";
import Role from "../models/Role.js";

dotenv.config();

const seedKitchenPermissions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1️⃣ Create kitchen permissions if they don't exist
    const kitchenPermissions = [
      {
        name: "kitchen:view",
        description: "View kitchen orders and dashboard"
      },
      {
        name: "kitchen:update",
        description: "Update order preparation status and item availability"
      }
    ];

    console.log("📝 Adding kitchen permissions...");
    
    for (const perm of kitchenPermissions) {
      const exists = await Permission.findOne({ name: perm.name });
      if (!exists) {
        await Permission.create(perm);
        console.log(`✅ Created permission: ${perm.name}`);
      } else {
        console.log(`⏭️  Permission already exists: ${perm.name}`);
      }
    }

    // 2️⃣ Get all permission IDs
    const allKitchenPerms = await Permission.find({
      name: { $in: ["kitchen:view", "kitchen:update"] }
    });

    // 3️⃣ Update chef role to include kitchen permissions
    const chefRole = await Role.findOne({ name: "chef" });
    
    if (chefRole) {
      // Add kitchen permissions to chef role (avoid duplicates)
      const newPermissions = allKitchenPerms.map(p => p._id);
      const existingPermissions = chefRole.permissions.map(p => p.toString());
      
      newPermissions.forEach(permId => {
        if (!existingPermissions.includes(permId.toString())) {
          chefRole.permissions.push(permId);
        }
      });

      await chefRole.save();
      console.log("✅ Chef role updated with kitchen permissions");
    } else {
      console.log("⚠️  Chef role not found. Creating it...");
      
      // Create chef role with kitchen permissions
      await Role.create({
        name: "chef",
        permissions: allKitchenPerms.map(p => p._id)
      });
      console.log("✅ Chef role created with kitchen permissions");
    }

    // 4️⃣ Show final chef permissions
    const updatedChefRole = await Role.findOne({ name: "chef" })
      .populate("permissions", "name description");
    
    console.log("\n👨‍🍳 Chef Role Permissions:");
    updatedChefRole.permissions.forEach(p => {
      console.log(`  - ${p.name}: ${p.description}`);
    });

    console.log("\n✅ Kitchen permissions seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedKitchenPermissions();