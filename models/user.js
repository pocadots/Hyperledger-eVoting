const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
	username: { type: String, required: true },
	password: { type: String, required: true },
    id: {type: String, required: true},
	organization: { type: String, required: true, default: "org1"},
	role: { type: String, enum: ["user", "admin"], default: "user" }
});

// Hash the password before saving the user
userSchema.pre("save", async function (next) {
	if (this.isModified("password") || this.isNew) {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	}
	next();
});

module.exports = mongoose.model("User", userSchema);