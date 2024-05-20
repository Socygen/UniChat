const UserModel = require('../../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const createUser = async (req, res) => {
    const { mobile, userName, password, email, profileImage, fcmToken } = req.body;
    try {
        let existingUser = await UserModel.findOne({ mobile });

        if (existingUser) {
            existingUser.fcmToken = fcmToken;
            await existingUser.save();

            const token = jwt.sign({ user_id: existingUser._id, mobile }, process.env.TOKEN_KEY);
            existingUser.token = token;

            return res.send({
                data: existingUser,
                message: "User already exists. FCM token updated.",
                status: true
            });
        } else {
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(password, salt);

            let newUser = await UserModel.create({
                mobile,
                userName,
                email,
                profileImage,
                fcmToken,
                password: passwordHash
            });

            const token = jwt.sign({ user_id: newUser._id, mobile }, process.env.TOKEN_KEY);
            newUser.token = token;

            return res.send({
                data: newUser,
                message: "User created successfully.",
                status: true
            });
        }
    } catch (error) {
        console.log("Error occurred:", error);
        return res.status(500).json({ status: false, error: "Internal Server Error" });
    }
}

const loginUser = async (req, res) => {
    const { mobile, password, fcmToken } = req.body

    try {
        const result = await UserModel.findOne({ mobile: mobile })
        if (!!result) {
            let isPasswordValid = await bcrypt.compare(password, result.password)
            if (!!isPasswordValid) {
                const token = jwt.sign({ user_id: result?._id, mobile }, process.env.TOKEN_KEY);

                if (!!fcmToken) {
                    result.fcmToken = fcmToken
                    result.save()
                }
                const deepCopy = JSON.parse(JSON.stringify(result))
                deepCopy.token = token
                delete deepCopy.password

                res.send({
                    data: deepCopy,
                    status: true
                })
            } else {
                res.status(403).json({ status: false, error: "Password/email not correct" })
            }
        } else {
            res.status(403).json({ status: false, error: "Password/email not correct" })
        }

    } catch (error) {
        res.status(403).json({ status: false, error: error })
    }
}

const fetchAllUsers = async (req, res) => {
    try {
        let data = await UserModel.find({})
        res.send({
            data: data,
            status: true
        })
    } catch (error) {
        res.status(403).json({ status: false, error: error })
    }
}

const fetchUsersByIds = async (req, res) => {
    const userIds = req.query.userIds.split(',');
    try {
        let data = await UserModel.find({ _id: { $in: userIds } }).select('-password');
        res.send({
            data: data,
            status: true
        })
    } catch (error) {
        console.log("error raised", error)
        res.status(403).json({ status: false, error: error })
    }
}

const fetchExpoTokens = async (req, res) => {
    const userIds = req.query.userIds.split(',');

    try {
        let data = await UserModel.find({ _id: { $in: userIds } }).select('fcmToken userName email mobile');
        res.send({
            data: data,
            status: true
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
}

const checkContacts = async (req, res) => {
    try {
      const { phoneNumbers } = req.body;
      
      if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
        return res.status(400).json({ status: false, error: "Invalid phone numbers format" });
      }
      
      const existingUsers = await UserModel.find({ mobile: { $in: phoneNumbers } });
      const existingNumbers = existingUsers.map(user => user.mobile);
  
      const result = phoneNumbers.map(number => ({
        number,
        exists: existingNumbers.includes(number)
      }));
  
      res.send({
        data: result,
        status: true
      });
    } catch (error) {
      res.status(403).json({ status: false, error: error.message });
    }
  };
  

module.exports = {
    createUser,
    loginUser,
    fetchAllUsers,
    fetchUsersByIds,
    fetchExpoTokens,
    checkContacts
}
