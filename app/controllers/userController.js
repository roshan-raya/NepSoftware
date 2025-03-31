const UserModel = require('../models/userModel');

class UserController {
    static async getUsersList(req, res) {
        try {
            const users = await UserModel.getAllUsers();
            res.render('users_list', { title: 'Users List', users });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching users");
        }
    }

    static async getUserProfile(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            const user = await UserModel.getUserById(userId);
            
            if (!user) {
                return res.status(404).render('users_profile', { 
                    title: 'User Not Found', 
                    user: null 
                });
            }
            
            const rides = await UserModel.getUserRides(userId);
            const requests = await UserModel.getUserRequests(userId);
            
            res.render('users_profile', { 
                title: `${user.name}'s Profile`, 
                user, 
                rides, 
                requests 
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching user profile");
        }
    }
}

module.exports = UserController; 