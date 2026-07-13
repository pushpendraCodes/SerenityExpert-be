declare namespace NodeJS {
  interface ProcessEnv {
    // Server
    PORT: string;
    NODE_ENV: "development" | "production" | "test";
    FRONTEND_URL: string;
    BACKEND_URL: string;

    // Database
    MONGODB_URI: string;

    // JWT
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRE: string;
    REFRESH_TOKEN_EXPIRE: string;

    // Mail / Resend
    SMTP_EMAIL: string;
    SMTP_PASSWORD: string;
    SMTP_FROM_NAME: string;
    RESEND_API_KEY: string;
    ADMIN_EMAIL: string;

    // CORS
    ALLOWED_ORIGINS: string;

    // Google OAuth
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;

    // Security
    IP_SALT: string;

    // Redis
    REDIS_PASSWORD: string;
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_USERNAME: string;

    // Razorpay
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
    RAZORPAY_WEBHOOK_SECRET: string;

    // Gemini
    GEMINI_API_KEY: string;

    // Agora
    AGORA_APP_ID?: string;
    AGORA_APP_CERTIFICATE?: string;

    // Firebase
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_CLIENT_EMAIL?: string;
    FIREBASE_PRIVATE_KEY?: string;
  }
}
