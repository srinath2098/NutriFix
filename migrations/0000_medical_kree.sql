CREATE TABLE "blood_test_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"blood_test_id" integer NOT NULL,
	"nutrient_id" integer NOT NULL,
	"value" real NOT NULL,
	"status" varchar NOT NULL,
	"severity" varchar
);
--> statement-breakpoint
CREATE TABLE "blood_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"test_date" timestamp NOT NULL,
	"file_name" varchar,
	"extracted_text" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meal_plan_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_plan_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"meal_type" varchar NOT NULL,
	"recipe_id" integer,
	"custom_meal" varchar,
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"week_start_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nutrients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"unit" varchar NOT NULL,
	"normal_range_min" real,
	"normal_range_max" real,
	"description" text,
	CONSTRAINT "nutrients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"instructions" text NOT NULL,
	"ingredients" jsonb NOT NULL,
	"cook_time" integer,
	"servings" integer,
	"image_url" varchar,
	"rating" real,
	"nutritional_benefits" text[],
	"target_nutrients" text[],
	"dietary_tags" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_recipe_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"recipe_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"dietary_preferences" text[],
	"allergies" text[],
	"health_goals" text[],
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "blood_test_results" ADD CONSTRAINT "blood_test_results_blood_test_id_blood_tests_id_fk" FOREIGN KEY ("blood_test_id") REFERENCES "public"."blood_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_test_results" ADD CONSTRAINT "blood_test_results_nutrient_id_nutrients_id_fk" FOREIGN KEY ("nutrient_id") REFERENCES "public"."nutrients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_tests" ADD CONSTRAINT "blood_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_entries" ADD CONSTRAINT "meal_plan_entries_meal_plan_id_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_entries" ADD CONSTRAINT "meal_plan_entries_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recipe_ratings" ADD CONSTRAINT "user_recipe_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recipe_ratings" ADD CONSTRAINT "user_recipe_ratings_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");