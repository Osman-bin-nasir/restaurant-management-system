import Menu from "../models/MenuItem.js";
import CustomError from "../utils/customError.js";

export const createMenuItem = async (req, res, next) => {
  try {
    const { name, category, price, description, branchId } = req.body;

    // Cloudinary upload result automatically attached by multer
    const imageUrl = req.file ? req.file.path : null;

    const newItem = await Menu.create({
      name,
      category,
      price,
      description,
      branchId,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Menu item created",
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMenuItems = async (req, res, next) => {
  try {
    const menu = await Menu.find().populate("branchId", "name location");
    res.json({ success: true, MenuItems: menu });
  } catch (error) {
    next(error);
  }
};

export const getMenuById = async (req, res, next) => {
  try {
    const menu = await Menu.findById(req.params.id).populate("branchId", "name location");
    if (!menu) return next(new CustomError("Menu item not found", 404));
    res.json({ success: true, MenuItem: menu });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const { name, category, price, description, branchId } = req.body;

    const updateData = { name, category, price, description, branchId };

    if (req.file) {
      updateData.image = req.file.path; // new image uploaded
    }

    const menu = await Menu.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!menu) return next(new CustomError("Menu item not found", 404));

    res.json({ success: true, message: "Menu updated", data: menu });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) return next(new CustomError("Menu item not found", 404));
    res.json({ success: true, message: "Menu item deleted" });
  } catch (error) {
    next(error);
  }
};