import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Clock, Package, Image as ImageIcon } from 'lucide-react';
import axios from '../../api/axios.js';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    cookingTime: '',
    availability: true,
    ingredients: '',
    image: null // store file here
  });

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await axios.get("/menu");
        if (res.data.success) {
          setMenuItems(res.data.MenuItems);
          setFilteredItems(res.data.MenuItems);
        }
      } catch (err) {
        console.error("Failed to fetch menu items:", err);
      }
    };
    fetchMenuItems();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = [...menuItems];
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchQuery]);

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Submit (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("category", formData.category);
      fd.append("price", formData.price);
      fd.append("description", formData.description);
      fd.append("cookingTime", formData.cookingTime);
      fd.append("availability", formData.availability);
      fd.append("ingredients", formData.ingredients);
      fd.append("branchId", "68f7d54d52294df4e0fcc184");
      if (formData.image) fd.append("image", formData.image);

      if (editingItem) {
        // UPDATE
        const res = await axios.patch(`/menu/${editingItem._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const updatedItem = res.data.data;
        setMenuItems(prev =>
          prev.map(item => (item._id === editingItem._id ? updatedItem : item))
        );
      } else {
        // CREATE
        const res = await axios.post('/menu', fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newItem = res.data.data;
        setMenuItems(prev => [...prev, newItem]);
      }

      resetForm();
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  const categories = ['All Categories', 'Snack', 'Meal', 'Vegan', 'Dessert', 'Drink'];

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      cookingTime: '',
      availability: true,
      ingredients: '',
      image: null
    });
    setPreviewImage(null);
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      cookingTime: item.cookingTime?.toString() || '',
      availability: item.availability,
      ingredients: item.ingredients?.join(', ') || '',
      image: null
    });
    setPreviewImage(item.image || null);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`/menu/${id}`);
      setMenuItems(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const categoryImages = {
    Snack: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500',
    Meal: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    Vegan: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
    Dessert: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500',
    Drink: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=500'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500 mt-1">Manage your restaurant menu items</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-orange-500/30"
          >
            <Plus size={20} />
            Add new
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.filter(cat => cat !== 'All Categories').map(category => (
              <div
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? 'All Categories' : category)}
                className={`cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:scale-105 ${selectedCategory === category ? 'ring-4 ring-orange-500' : ''}`}
              >
                <div className="relative h-40">
                  <img src={categoryImages[category]} alt={category} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-white font-bold text-lg">{category}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div key={item._id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-white rounded-full shadow-lg hover:bg-orange-500 hover:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item._id)} className="p-2 bg-white rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                {!item.availability && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">Unavailable</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                  <span className="text-orange-500 font-bold text-lg">₹{item.price}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{item.cookingTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package size={16} />
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{item.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Margherita Pizza"
                />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select category</option>
                    {categories.filter(c => c !== 'All Categories').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="299"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe your dish..."
                />
              </div>

              {/* Cooking Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cooking Time (minutes) *</label>
                <input
                  type="number"
                  name="cookingTime"
                  value={formData.cookingTime}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="15"
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ingredients (comma-separated)</label>
                <input
                  type="text"
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Flour, Cheese, Tomato Sauce, Basil"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ImageIcon size={16} /> Menu Image
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
                />
                {previewImage && (
                  <img src={previewImage} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded-lg border" />
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="availability"
                  id="availability"
                  checked={formData.availability}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="availability" className="text-sm font-semibold text-gray-700">
                  Available for orders
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
