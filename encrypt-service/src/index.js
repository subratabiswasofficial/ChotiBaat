import { createDiffieHellman } from "crypto";

// Generate Alice's keys
const alice = createDiffieHellman(1024); // 2048-bit prime

/* will share */
const alicePublicKey = alice.generateKeys();
const alicePrime = alice.getPrime();
const aliceGenerator = alice.getGenerator();

console.log({
  pbkey: alicePublicKey.toString("hex"),
  prime: alicePrime.toString("hex"),
  generator: aliceGenerator.toString("hex"),
});

// Generate Bob's keys using the same prime and generator
const bob = createDiffieHellman(alicePrime, aliceGenerator);

const bobPublicKey = bob.generateKeys();

// Exchange and compute the shared secret
const aliceSharedSecret = alice.computeSecret(bobPublicKey);
const bobSharedSecret = bob.computeSecret(alicePublicKey);

// Verify that the shared secrets match
console.log("Alice's Shared Secret:", aliceSharedSecret.toString("hex"));
console.log("Bob's Shared Secret:", bobSharedSecret.toString("hex"));

if (aliceSharedSecret.toString("hex") === bobSharedSecret.toString("hex")) {
  console.log("Key exchange successful! Shared secrets match.");
} else {
  console.log("Key exchange failed. Shared secrets do not match.");
}
