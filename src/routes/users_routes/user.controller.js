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


const fetchUserDetails = async (req, res) => {
    const { userId } = req.query
    try {
        let data = await UserModel.findOne({ _id: userId }).select('-password')
        res.send({
            data: data,
            status: true
        })
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
        const contacts = req.body;
    
        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ status: false, error: "Invalid contacts format. Expected an array of contacts." });
        }
    
        // Flatten and clean phone numbers
        const allPhoneNumbers = contacts.flatMap(contact => contact.phoneNumbers.map(phone => phone.number));
        const cleanPhoneNumbers = allPhoneNumbers.map(phone => phone.replace(/^\+?91/, '').replace(/^91/, '').replace(/\D/g, ''));
        
        // Find existing users
        const existingUsers = await UserModel.find({ mobile: { $in: cleanPhoneNumbers } });
        const existingUserMap = new Map(existingUsers.map(user => [user.mobile.replace(/\D/g, ''), user]));
    
        // Separate contacts into existing and non-existing
        const result = {
            existing: [],
            notExisting: []
        };

        contacts.forEach(contact => {
            const cleanedContactPhoneNumbers = contact.phoneNumbers.map(phone => phone.number.replace(/^\+?91/, '').replace(/^91/, '').replace(/\D/g, ''));
            const existingUser = cleanedContactPhoneNumbers.map(phone => existingUserMap.get(phone)).find(user => user);
            const isExists = !!existingUser;

            const mergedContact = {
                displayName: contact.displayName,
                phoneNumber: cleanedContactPhoneNumbers,
                isExists,
                ...(isExists && {
                    _id: existingUser._id,
                    profileImage: existingUser.profileImage,
                    userName: existingUser.userName,
                    mobile: existingUser.mobile,
                    online: existingUser.online,
                    lastSeen: existingUser.lastSeen
                })
            };

            if (isExists) {
                result.existing.push(mergedContact);
            } else {
                result.notExisting.push(mergedContact);
            }
        });

        // Sort existing and notExisting contacts alphabetically by displayName
        const sortByDisplayName = (a, b) => {
            if (a.displayName && b.displayName) {
                return a.displayName.localeCompare(b.displayName);
            } else if (a.displayName) {
                return -1;
            } else if (b.displayName) {
                return 1;
            } else {
                return 0;
            }
        };

        result.existing.sort(sortByDisplayName);
        result.notExisting.sort(sortByDisplayName);

        res.send({
            data: result,
            status: true
        });
    } catch (error) {
        console.error('Error processing contacts:', error);
        res.status(500).json({ status: false, error: "Internal server error. Please try again later." });
    }
};


const updateUser = async (req, res) => {
  const { mobile, userName, email, profileImage, fcmToken, password } = req.body;

  try {
    let user = await UserModel.findOne({ mobile });

    if (!user) {
      return res.status(404).send({
        message: 'User not found',
        status: false
      });
    }

    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (profileImage) user.profileImage = profileImage;
    if (fcmToken) user.fcmToken = fcmToken;
    if (password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    return res.status(200).send({
      data: user,
      message: 'User updated successfully',
      status: true
    });
  } catch (error) {
    console.log('Error occurred:', error);
    return res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};


module.exports = {
    createUser,
    loginUser,
    fetchAllUsers,
    fetchUsersByIds,
    fetchExpoTokens,
    checkContacts,
    fetchUserDetails,
    updateUser
}
