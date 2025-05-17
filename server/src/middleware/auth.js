// Authentication middleware
const jwtAuth = async (req, res, next) => {

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ "Error": "Token is not in header" });
    }

    jwt.verify(token, SECRET_KEY, async(err, data) => {
        if (err) {
            return res.status(401).json({ "Error": "Not authenticated" });
        }
        try {
            const result = await pool.query(
            "SELECT * FROM Users WHERE user_id = $1", [data.user_id]);
            const user = result.rows[0]; // user_id is unique, so max 1 row

            if (!user) {
                return res.status(401).json({ "Error": "User matching token not found" });
            }
            else {
                req.user = user;
                next();
            }
        }
        catch (error) {
            console.error('An error occurred:', error);
            res.status(500).send("Server error");
        }
    });
}