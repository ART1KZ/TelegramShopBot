import { Schema, model } from "mongoose";

const ConfigurationSchema = new Schema(
    {
        created_at: {
            type: Date,
            default: () => new Date(),
        },
        admin_password: {
            type: String,
            required: true,
        },
        btc_address: {
            type: String,
            required: true,
        },
    },
    { collection: "configuration" }
);

const Configuration = model("Configuration", ConfigurationSchema);

export default Configuration;
