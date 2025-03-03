import { Schema, model } from "mongoose";

const ConfigurationSchema = new Schema(
    {
        created_at: {
            type: Date,
            default: () => new Date(),
        },
        adminPassword: {
            type: String,
            required: true,
        },
        btcAddress: {
            type: String,
            required: true,
        },
    },
    { collection: "configuration" }
);

const Configuration = model("Configuration", ConfigurationSchema);

export default Configuration;
