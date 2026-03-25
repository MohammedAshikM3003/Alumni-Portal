import { comparePassword } from '../security/bycrypt.js';
import { generateToken } from '../security/jwt.js';
import User from '../models/user.js';



export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or userId (register number)
    const user = await User.findOne({
      $or: [{ email: identifier }, { userId: identifier }],
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT
    const token = generateToken({ id: user._id, role: user.role });

    // Base user response
    let userResponse = {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // If coordinator, fetch department information
    if (user.role === 'coordinator') {
      try {
        const { default: Coordinator } = await import('../models/coordinator.js');
        const coordinator = await Coordinator.findOne({ userId: user._id });
        if (coordinator) {
          userResponse.department = coordinator.department; // This will be "CSE", "ECE", etc.
          userResponse.designation = coordinator.designation;
          userResponse.staffId = coordinator.staffId;
        }
      } catch (error) {
        console.warn('Could not fetch coordinator details:', error.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Authenticated successfully',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;

    // Fetch user info from Google using access token
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!googleRes.ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    const googleUser = await googleRes.json();
    const email = googleUser.email;

    // Check if user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Contact Your Admin',
      });
    }

    // Generate JWT
    const token = generateToken({ id: user._id, role: user.role });

    // Base user response
    let userResponse = {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // If coordinator, fetch department information
    if (user.role === 'coordinator') {
      try {
        const { default: Coordinator } = await import('../models/coordinator.js');
        const coordinator = await Coordinator.findOne({ userId: user._id });
        if (coordinator) {
          userResponse.department = coordinator.department; // This will be "CSE", "ECE", etc.
          userResponse.designation = coordinator.designation;
          userResponse.staffId = coordinator.staffId;
        }
      } catch (error) {
        console.warn('Could not fetch coordinator details:', error.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Authenticated successfully',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};