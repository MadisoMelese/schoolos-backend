# Seeding Test Users

This guide explains how to seed test users into the database for development and testing.

## Quick Start

Run the seed script:

```bash
npm run seed:users
```

## What Gets Created

The seed script creates three test users:

### 1. Admin User
- **Email:** `madisomelese2@gmail.com`
- **Password:** `@madisha5423$`
- **Role:** `admin`
- **Status:** Verified and Active

### 2. Student User
- **Email:** `student@example.com`
- **Password:** `Student123!`
- **Role:** `user`
- **Status:** Verified and Active

### 3. Teacher User
- **Email:** `teacher@example.com`
- **Password:** `Teacher123!`
- **Role:** `user`
- **Status:** Verified and Active

## How It Works

1. Connects to MongoDB using `MONGO_URI` from `.env`
2. Checks if each user already exists
3. Creates users that don't exist
4. Skips users that already exist (safe to run multiple times)
5. Displays created users and their credentials

## Important Notes

- **Safe to Run Multiple Times:** The script checks if users exist before creating them
- **Passwords are Hashed:** Passwords are automatically hashed using bcrypt
- **No Data Loss:** The script doesn't delete existing users (commented out by default)
- **Development Only:** These are test credentials for development

## Customizing Test Users

To add or modify test users, edit `scripts/seed-users.ts`:

```typescript
const testUsers = [
  {
    firstname: "Your Name",
    lastname: "Your Last Name",
    username: "your.username",
    email: "your@example.com",
    password: "YourPassword123!",
    role: "admin", // or "user"
    isVerified: true,
    isActive: true,
  },
  // Add more users here
];
```

Then run:

```bash
npm run seed:users
```

## Troubleshooting

### "Connected to MongoDB" but script hangs

- Check your `MONGO_URI` in `.env`
- Ensure MongoDB is running and accessible
- Check network connectivity

### "User already exists"

- This is normal - the script skips existing users
- To recreate users, manually delete them from MongoDB first

### Password doesn't work

- Ensure you're using the exact password from the seed script output
- Passwords are case-sensitive
- Check that the user's `isActive` and `isVerified` are both `true`

## Testing Login

1. Run the seed script: `npm run seed:users`
2. Start the frontend: `npm run dev` (in schoolos-frontend)
3. Go to http://localhost:3000/login
4. Use one of the test credentials above
5. You should be logged in and redirected to the dashboard

## Resetting Users

To delete all users and start fresh:

```bash
# Edit scripts/seed-users.ts and uncomment this line:
// await User.deleteMany({});

# Then run:
npm run seed:users
```

Or use MongoDB Compass to manually delete users from the `users` collection.
