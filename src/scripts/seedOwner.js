import { connectDatabase } from "../config/db.js";
import { env } from "../config/env.js";
import { createOwnerFromEnv } from "../services/auth.service.js";

const run = async () => {
  await connectDatabase();

  const { user, created } = await createOwnerFromEnv({
    name: env.ownerName,
    email: env.ownerEmail,
    password: env.ownerPassword
  });

  console.log(created ? "Owner user created." : "Owner user already existed and was updated.");
  console.log(`Owner email: ${user.email}`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
