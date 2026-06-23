import { Schema, model, type Document } from 'mongoose';

export interface IUser {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: 'alumni' | 'admin' | 'coordinator';
  resetOtp?: string;
  resetOtpExpiry?: Date;
  resetOtpVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser & Document;

const userSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (this: any, v: string): boolean {
          switch (this.role) {
            case 'alumni':
              return /^\d{11}$/.test(v);
            case 'admin':
            case 'coordinator':
              return /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9\-]+$/.test(v);
            default:
              return false;
          }
        },
        message: function (this: any): string {
          if (this.role === 'alumni') {
            return 'Alumni userId must be exactly 11 digits';
          }
          return `${this.role} userId must be a mix of characters and numbers`;
        },
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetOtp: {
      type: String,
    },
    resetOtpExpiry: {
      type: Date,
    },
    resetOtpVerifiedAt: {
      type: Date,
    },
    role: {
      type: String,
      required: true,
      enum: ['alumni', 'admin', 'coordinator'],
    },
  },
  { timestamps: true }
);

const User = model<IUser>('User', userSchema);

export default User;
