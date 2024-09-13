const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
    id: {type: String},
	description: { type: String }
});

module.exports = mongoose.model("Option", optionSchema);