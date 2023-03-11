import mongoose from "mongoose";
import mongoosePaginator from "mongoose-paginate-v2";
import dotenv from "dotenv";

dotenv.config();

const dbLatencyLoggerTime = Date.now();
const dbLatencyLogger = () => console.log(`[-] Database connected in : ${Date.now() - dbLatencyLoggerTime}ms`);

const db = mongoose.createConnection(process.env.USERDB_URL);

db.on("error", (error) => console.error(error));
db.once("open", () => dbLatencyLogger());

// users schema
export const users = db.model(
  "users",
  new mongoose.Schema({
    name: String,
    email: String,
    uid: String,
    provider: String,
    img: String,
    photoURL: String,
    phone: String,
    referal: String,
    referedBy: String,
    disabled: { type: Boolean, default: false },
    admin: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date() },
    lastLogin: { type: Date, default: new Date() },
    lastRefresh: { type: Date, default: new Date() },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    payment: Object,
    preferences: {
      type: Object,
      default: {
        languages: [],
        subjects: [],
        knowlageLevel: Number,
        difficulty: {
          type: Number,
          default: 0,
        },
      },
    },
  })
);

// products
const productsSchema = new mongoose.Schema({
  PID: String,
  title: String,
  description: String,
  category: String,
  price: Number,
  rating: { type: Number, default: 0 },
  views: Array,
  addedToCart: Array,
  interactions: Array,
  reachedCheckout: Array,
  productsListingViews: Array,
  impressions: Array,
  purchased: Array,
  cancelled: Array,
  purchaseCompleted: Array,
  lastPurchased: Date,
  creationTime: {
    type: Date,
    default: new Date(),
  },
  offer: {
    type: Number,
    default: 0,
  },
  stock: Number,
});

productsSchema.plugin(mongoosePaginator);

export const products = db.model("products", productsSchema);