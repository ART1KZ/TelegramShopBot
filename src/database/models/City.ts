import { Schema, model } from "mongoose";

const CitySchema = new Schema({
    created_at: {
        type: Date,
        default: () => new Date(),
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
});

const City = model("City", CitySchema);

export default City;
