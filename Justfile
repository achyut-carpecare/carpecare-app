
db-pull:
    npx drizzle-kit pull
    cp ./drizzle/schema.ts ./src/features/database/schema.ts
    cp ./drizzle/relations.ts ./src/features/database/relations.ts
