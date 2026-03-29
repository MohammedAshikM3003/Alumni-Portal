import User from '../models/user.js';
import Alumni from '../models/alumni.js';

// Search all alumni by name, department, and batch (returns all matches)
export const searchAlumniAll = async (req, res) => {
  try {
    const { name, department, batch } = req.query;

    if (!name || !department || !batch) {
      return res.status(400).json({
        success: false,
        message: 'Name, department, and batch are required'
      });
    }

    // Parse batch (e.g., "2020-2024" -> yearFrom: 2020, yearTo: 2024)
    const batchParts = batch.split('-');
    const yearFrom = parseInt(batchParts[0]);
    const yearTo = batchParts[1] ? parseInt(batchParts[1]) : yearFrom + 4;

    const alumni = await Alumni.find({
      name: { $regex: name, $options: 'i' },
      branch: { $regex: department, $options: 'i' },
      yearFrom: yearFrom,
      yearTo: yearTo
    }).select('name email branch yearFrom yearTo profilePhoto');

    if (alumni.length === 0) {
      return res.json({
        success: false,
        message: 'No alumni found',
        alumni: []
      });
    }

    // Format response with profile picture URL
    const formattedAlumni = alumni.map(a => ({
      _id: a._id,
      name: a.name,
      email: a.email,
      branch: a.branch,
      batch: `${a.yearFrom}-${a.yearTo}`,
      profilePicture: a.profilePhoto ? `/api/images/${a.profilePhoto}` : null
    }));

    res.json({
      success: true,
      alumni: formattedAlumni,
      count: formattedAlumni.length
    });

  } catch (error) {
    console.error('Error searching alumni:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching alumni',
      error: error.message
    });
  }
};

// Search alumni by email
export const searchAlumniByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const alumni = await Alumni.findOne({
      email: { $regex: `^${email}$`, $options: 'i' }
    }).select('name email branch yearFrom yearTo profilePhoto');

    if (!alumni) {
      return res.json({
        success: false,
        message: 'Alumni not found'
      });
    }

    res.json({
      success: true,
      alumni: {
        _id: alumni._id,
        name: alumni.name,
        email: alumni.email,
        branch: alumni.branch,
        batch: `${alumni.yearFrom}-${alumni.yearTo}`,
        profilePicture: alumni.profilePhoto ? `/api/images/${alumni.profilePhoto}` : null
      }
    });

  } catch (error) {
    console.error('Error searching alumni by email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching alumni',
      error: error.message
    });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { search, limit = 50 } = req.query;
    let query = {};

    // Add search functionality
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password') // Exclude password field
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

// Get users by role (e.g., alumni, admin, coordinator)
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { search, limit = 50 } = req.query;

    // Validate role
    const validRoles = ['alumni', 'admin', 'coordinator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if user has permission to view this role
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Coordinator privileges required.'
      });
    }

    let query = { role };

    // Add search functionality
    if (search) {
      query.$and = [
        { role },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { userId: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const users = await User.find(query)
      .select('-password') // Exclude password field
      .limit(parseInt(limit))
      .sort({ name: 1 }); // Sort by name alphabetically

    // Return with role-specific naming
    const responseKey = role === 'alumni' ? 'alumni' : 'users';

    res.json({
      success: true,
      [responseKey]: users,
      count: users.length
    });

  } catch (error) {
    console.error(`Error fetching ${req.params.role}:`, error);
    res.status(500).json({
      success: false,
      message: `Server error while fetching ${req.params.role}`,
      error: error.message
    });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission (admin, coordinator, or own profile)
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user has permission (admin or own profile)
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    // Prevent updating sensitive fields unless admin
    if (req.user.role !== 'admin') {
      delete updates.role;
      delete updates.userId;
    }

    // Don't allow password updates through this endpoint
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
      error: error.message
    });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: error.message
    });
  }
};