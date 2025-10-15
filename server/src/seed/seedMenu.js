import mongoose from "mongoose";
import dotenv from "dotenv";
import Menu from "../models/MenuItem.js";

dotenv.config();

const menuItems = [
  {
    name: "Margherita Pizza",
    category: "Pizza",
    price: 299,
    description: "Classic cheese pizza with fresh basil and tomato sauce",
    image: "/images/pizza-margherita.jpg",
    cookingTime: 15,
    availability: true,
    ingredients: ["Flour", "Cheese", "Tomato Sauce", "Basil"],
    branchId: "68ee273056c2611e2d65b80c"
  },
  {
    name: "Veg Burger",
    category: "Burger",
    price: 199,
    description: "Crispy veggie patty with lettuce and mayo",
    image: "/images/veg-burger.jpg",
    cookingTime: 10,
    availability: true,
    ingredients: ["Bun", "Veg Patty", "Lettuce", "Mayo"],
    branchId: "68ee273056c2611e2d65b80c"
  },
  {
    name: "Chicken Biryani",
    category: "Main Course",
    price: 349,
    description: "Aromatic rice cooked with marinated chicken and spices",
    image: "/images/chicken-biryani.jpg",
    cookingTime: 25,
    availability: true,
    ingredients: ["Rice", "Chicken", "Spices", "Onion"],
    branchId: "68ee273056c2611e2d65b80c"
  },
  {
    name: "Cold Coffee",
    category: "Beverage",
    price: 149,
    description: "Chilled coffee blended with milk and ice cream",
    image: "/images/cold-coffee.jpg",
    cookingTime: 5,
    availability: true,
    ingredients: ["Milk", "Coffee", "Sugar", "Ice Cream"],
    branchId: "68ee273056c2611e2d65b80c"
  },
  {
    name: "Gulab Jamun",
    category: "Dessert",
    price: 99,
    description: "Soft fried balls soaked in sugar syrup",
    image: "/images/gulab-jamun.jpg",
    cookingTime: 5,
    availability: true,
    ingredients: ["Milk Powder", "Flour", "Sugar Syrup"],
    branchId: "68ee273056c2611e2d65b80c"
  }
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Menu.deleteMany();
    await Menu.insertMany(menuItems);
    console.log("✅ Menu items seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding menu items:", error);
    process.exit(1);
  }
};

importData();
