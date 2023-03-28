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
    phone: { type: String, default: null },
    referal: String,
    referedBy: String,
    disabled: { type: Boolean, default: false },
    admin: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date() },
    lastLogin: { type: Date, default: new Date() },
    lastRefresh: { type: Date, default: new Date() },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
  })
);

// products
const productsSchema = new mongoose.Schema({
  pid: String,
  title: String,
  description: String,
  category: String,
  price: Number,
  rating: { type: Number, default: 0 },
  // views: Array,
  // addedToCart: Array,
  // interactions: Array,
  // reachedCheckout: Array,
  // productsListingViews: Array,
  // impressions: Array,
  // purchased: Array,
  // cancelled: Array,
  // purchaseCompleted: Array,
  // lastPurchased: Date,
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

// to save refresh tokens
export const refreshTokens = db.model(
  "refreshTokens",
  new mongoose.Schema({
    value: String,
    uid: String,
    createdAt: {
      type: Date,
      default: new Date(),
    },
  })
);

export const cart = db.model(
  "cart",
  new mongoose.Schema({
    uid: String,
    products: [
      {
        pid: String,
        quantity: {
          type: Number,
          default: 1,
        },
        updated: {
          type: Date,
          default: new Date(),
        },
        status: {
          type: String,
          default: "cart",
        },
        orderID: String,
      },
    ],
  })
);

// orderes
const ordersSchema = new mongoose.Schema({
  uid: String,
  orders: [
    {
      orderID: String,
      products: Array,
      address: Object,
      trackingID: String,
      couponCode: String,
      total: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        default: "pending",
      },
      paymentType: String,
      paymentDate: {
        type: Date,
        default: new Date(),
      },
      paymentError: Object,
      paymentDetails: Object,
      statusUpdate: {
        a: { status: String, date: Date },
        b: { status: String, date: Date },
        c: { status: String, date: Date },
        d: { status: String, date: Date },
        e: { status: String, date: Date },
      },
      update: {
        type: Date,
        default: new Date(),
      },
      paymentStatus: {
        type: String,
        default: "pending",
      },
      dateOFOrder: {
        type: Date,
        default: new Date(),
      },
    },
  ],
});

ordersSchema.plugin(mongoosePaginator);

export const orders = db.model("orders", ordersSchema);
