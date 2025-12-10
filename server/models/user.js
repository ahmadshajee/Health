const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Path to users data file
const usersFilePath = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
const dataDir = path.dirname(usersFilePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFilePath)) {
  fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
}

/**
 * Get all users from the JSON file
 * @returns {Array} Array of users
 */
const getUsers = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

/**
 * Save users to the JSON file
 * @param {Array} users - Array of users to save
 */
const saveUsers = (users) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
};

/**
 * Find a user by email
 * @param {string} email - Email to search for
 * @returns {Object|null} User object or null if not found
 */
const findUserByEmail = (email) => {
  if (!email) return null;
  const users = getUsers();
  const target = String(email).toLowerCase();
  return users.find(user => String(user.email).toLowerCase() === target) || null;
};

/**
 * Find a user by ID
 * @param {string} id - User ID to search for
 * @returns {Object|null} User object or null if not found
 */
const findUserById = (id) => {
  const users = getUsers();
  return users.find(user => user.id === id) || null;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Object} Created user object
 */
const createUser = async (userData) => {
  const users = getUsers();
  
  // Check if user already exists
  if (users.some(user => user.email === userData.email)) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };
  
  // Save user
  users.push(newUser);
  saveUsers(users);
  
  // Remove password from returned object
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

/**
 * Update a user
 * @param {string} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Object|null} Updated user object or null if not found
 */
const updateUser = async (id, userData) => {
  const users = getUsers();
  const index = users.findIndex(user => user.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Handle password update
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }
  
  // Update user
  users[index] = {
    ...users[index],
    ...userData,
    updatedAt: new Date().toISOString()
  };
  
  saveUsers(users);
  
  // Remove password from returned object
  const { password, ...userWithoutPassword } = users[index];
  return userWithoutPassword;
};

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {boolean} Success status
 */
const deleteUser = (id) => {
  const users = getUsers();
  const filteredUsers = users.filter(user => user.id !== id);
  
  if (filteredUsers.length === users.length) {
    return false;
  }
  
  saveUsers(filteredUsers);
  return true;
};

/**
 * Authenticate a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User object and JWT token
 */
const authenticateUser = async (email, password) => {
  const user = findUserByEmail(email);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate JWT token - use env variable or fallback secret
  const jwtSecret = process.env.JWT_SECRET || 'healthcare_management_secret_key_2025';
  const token = jwt.sign(
    { id: user.id, role: user.role },
    jwtSecret,
    { expiresIn: '1d' }
  );
  
  // Remove password from returned object
  const { password: userPassword, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token
  };
};

module.exports = {
  getUsers,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  authenticateUser
};
