"use strict";
const { PrismaClient, Difficulty, ShiftType, ChecklistType, TempDeviceType, TempUnit } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function getCurrentWeekBounds() {
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

async function main() {
  const email = "admin@bistroflow.com";
  console.log(`Starting seed database. Scoping everything to ${email}...`);

  console.log('Cleaning up existing data...');
  const safeDelete = async (promise, name) => {
    try {
      await promise;
    } catch (err) {
      if (err.code === 'P2021' || err.message?.includes('does not exist')) {
        console.log(`⚠️ Table ${name} does not exist. Skipping.`);
      } else {
        throw err;
      }
    }
  };

  await safeDelete(prisma.tempLog.deleteMany({}), 'TempLog');
  await safeDelete(prisma.tempDevice.deleteMany({}), 'TempDevice');
  await safeDelete(prisma.checklistRunItem.deleteMany({}), 'ChecklistRunItem');
  await safeDelete(prisma.checklistRun.deleteMany({}), 'ChecklistRun');
  await safeDelete(prisma.checklistTemplateItem.deleteMany({}), 'ChecklistTemplateItem');
  await safeDelete(prisma.checklistTemplate.deleteMany({}), 'ChecklistTemplate');
  await safeDelete(prisma.menuItem.deleteMany({}), 'MenuItem');
  await safeDelete(prisma.menu.deleteMany({}), 'Menu');
  await safeDelete(prisma.recipeIngredient.deleteMany({}), 'RecipeIngredient');
  await safeDelete(prisma.recipe.deleteMany({}), 'Recipe');
  await safeDelete(prisma.subcategory.deleteMany({}), 'Subcategory');
  await safeDelete(prisma.category.deleteMany({}), 'Category');
  await safeDelete(prisma.orderItem.deleteMany({}), 'OrderItem');
  await safeDelete(prisma.orderPhoto.deleteMany({}), 'OrderPhoto');
  await safeDelete(prisma.order.deleteMany({}), 'Order');
  await safeDelete(prisma.receiptItem.deleteMany({}), 'ReceiptItem');
  await safeDelete(prisma.receipt.deleteMany({}), 'Receipt');
  await safeDelete(prisma.ingredientTag.deleteMany({}), 'IngredientTag');
  await safeDelete(prisma.ingredient.deleteMany({}), 'Ingredient');
  await safeDelete(prisma.ingredientSubcategory.deleteMany({}), 'IngredientSubcategory');
  await safeDelete(prisma.ingredientCategory.deleteMany({}), 'IngredientCategory');
  await safeDelete(prisma.storageLocation.deleteMany({}), 'StorageLocation');
  await safeDelete(prisma.supplier.deleteMany({}), 'Supplier');
  
  await safeDelete(prisma.timeOffRequest.deleteMany({}), 'TimeOffRequest');
  await safeDelete(prisma.availability.deleteMany({}), 'Availability');
  await safeDelete(prisma.shiftSwap.deleteMany({}), 'ShiftSwap');
  await safeDelete(prisma.shift.deleteMany({}), 'Shift');
  await safeDelete(prisma.scheduleEmployeeOrder.deleteMany({}), 'ScheduleEmployeeOrder');
  await safeDelete(prisma.schedule.deleteMany({}), 'Schedule');
  await safeDelete(prisma.employee.deleteMany({}), 'Employee');
  await safeDelete(prisma.restaurant.deleteMany({}), 'Restaurant');
  await safeDelete(prisma.subAccount.deleteMany({}), 'SubAccount');
  await safeDelete(prisma.user.deleteMany({}), 'User');

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Manager",
      },
    });
    console.log("✔ Owner user created: admin@bistroflow.com / admin123");
  } else {
    console.log("✔ Owner user already exists");
  }
  const userId = user.id;

  console.log("Seeding restaurants...");
  const restaurantGrande = await prisma.restaurant.upsert({
    where: { shareToken: "bistro-grande-token" },
    update: {},
    create: {
      name: "Bistro Grande",
      address: "123 Gourmet Blvd, Food City",
      phone: "+1 (555) 123-4567",
      shareToken: "bistro-grande-token",
      userId,
    },
  });

  const restaurantPetite = await prisma.restaurant.upsert({
    where: { shareToken: "bistro-petite-token" },
    update: {},
    create: {
      name: "Bistro Petite",
      address: "45 Cozy Lane, Espresso Town",
      phone: "+1 (555) 987-6543",
      shareToken: "bistro-petite-token",
      userId,
    },
  });
  console.log("✔ Restaurants seeded");

  console.log("Seeding employees...");
  const employeesGrande = [
    { name: "Alice Smith", role: "Head Chef", email: "alice@bistroflow.com", color: "#e05555", hourlyRate: 25.0 },
    { name: "Bob Jones", role: "Sous Chef", email: "bob@bistroflow.com", color: "#d4a035", hourlyRate: 20.0 },
    { name: "Charlie Brown", role: "Line Cook", email: "charlie@bistroflow.com", color: "#4a9e6a", hourlyRate: 16.5 },
    { name: "Diana Prince", role: "Front of House Lead", email: "diana@bistroflow.com", color: "#8e44ad", hourlyRate: 18.0 },
    { name: "Evan Wright", role: "Server", email: "evan@bistroflow.com", color: "#3498db", hourlyRate: 15.0 },
  ];

  const dbEmployeesGrande = [];
  for (const emp of employeesGrande) {
    const dbEmp = await prisma.employee.create({
      data: {
        ...emp,
        restaurantId: restaurantGrande.id,
        isActive: true,
      },
    });
    dbEmployeesGrande.push(dbEmp);
  }

  const employeesPetite = [
    { name: "Fiona Green", role: "Kitchen Manager", email: "fiona@bistroflow.com", color: "#16a085", hourlyRate: 22.0 },
    { name: "George Black", role: "Cook", email: "george@bistroflow.com", color: "#f39c12", hourlyRate: 16.0 },
    { name: "Hannah White", role: "Cashier / Barista", email: "hannah@bistroflow.com", color: "#95a5a6", hourlyRate: 14.5 },
  ];

  for (const emp of employeesPetite) {
    await prisma.employee.create({
      data: {
        ...emp,
        restaurantId: restaurantPetite.id,
        isActive: true,
      },
    });
  }
  console.log("✔ Employees seeded");

  console.log("Seeding schedules and shifts...");
  const { monday, sunday } = getCurrentWeekBounds();
  
  const schedule = await prisma.schedule.upsert({
    where: {
      weekStart_restaurantId: {
        weekStart: monday,
        restaurantId: restaurantGrande.id,
      },
    },
    update: {},
    create: {
      weekStart: monday,
      weekEnd: sunday,
      notes: "Standard Summer Shift Rotation",
      published: true,
      restaurantId: restaurantGrande.id,
    },
  });

  const shiftsToCreate = [
    { employeeId: dbEmployeesGrande[0].id, dayOfWeek: 1, startTime: "08:00", endTime: "16:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[0].id, dayOfWeek: 2, startTime: "08:00", endTime: "16:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[0].id, dayOfWeek: 3, startTime: "08:00", endTime: "16:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[0].id, dayOfWeek: 4, startTime: "08:00", endTime: "16:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[0].id, dayOfWeek: 5, startTime: "08:00", endTime: "16:00", breakMinutes: 30 },

    { employeeId: dbEmployeesGrande[1].id, dayOfWeek: 1, startTime: "14:00", endTime: "22:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[1].id, dayOfWeek: 2, startTime: "14:00", endTime: "22:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[1].id, dayOfWeek: 3, startTime: "14:00", endTime: "22:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[1].id, dayOfWeek: 4, startTime: "14:00", endTime: "22:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[1].id, dayOfWeek: 5, startTime: "14:00", endTime: "22:00", breakMinutes: 30 },

    { employeeId: dbEmployeesGrande[2].id, dayOfWeek: 3, startTime: "15:00", endTime: "23:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[2].id, dayOfWeek: 4, startTime: "15:00", endTime: "23:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[2].id, dayOfWeek: 5, startTime: "15:00", endTime: "23:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[2].id, dayOfWeek: 6, startTime: "15:00", endTime: "23:00", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[2].id, dayOfWeek: 7, startTime: "15:00", endTime: "23:00", breakMinutes: 30 },

    { employeeId: dbEmployeesGrande[3].id, dayOfWeek: 2, startTime: "10:00", endTime: "18:00", breakMinutes: 45 },
    { employeeId: dbEmployeesGrande[3].id, dayOfWeek: 3, startTime: "10:00", endTime: "18:00", breakMinutes: 45 },
    { employeeId: dbEmployeesGrande[3].id, dayOfWeek: 4, startTime: "10:00", endTime: "18:00", breakMinutes: 45 },
    { employeeId: dbEmployeesGrande[3].id, dayOfWeek: 5, startTime: "10:00", endTime: "18:00", breakMinutes: 45 },
    { employeeId: dbEmployeesGrande[3].id, dayOfWeek: 6, startTime: "10:00", endTime: "18:00", breakMinutes: 45 },

    { employeeId: dbEmployeesGrande[4].id, dayOfWeek: 4, startTime: "16:00", endTime: "23:59", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[4].id, dayOfWeek: 5, startTime: "16:00", endTime: "23:59", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[4].id, dayOfWeek: 6, startTime: "16:00", endTime: "23:59", breakMinutes: 30 },
    { employeeId: dbEmployeesGrande[4].id, dayOfWeek: 7, startTime: "16:00", endTime: "23:59", breakMinutes: 30 },
  ];

  for (const shift of shiftsToCreate) {
    await prisma.shift.create({
      data: {
        ...shift,
        scheduleId: schedule.id,
        shiftType: ShiftType.WORK,
      },
    });
  }

  for (let i = 0; i < dbEmployeesGrande.length; i++) {
    await prisma.scheduleEmployeeOrder.create({
      data: {
        scheduleId: schedule.id,
        employeeId: dbEmployeesGrande[i].id,
        displayOrder: i,
      },
    });
  }
  console.log("✔ Schedule and Shifts seeded");

  console.log("Seeding suppliers...");
  const supplierFresh = await prisma.supplier.create({
    data: {
      name: "Fresh Organics Corp",
      phone: "+1 (555) 444-3333",
      email: "sales@fresh-organics.com",
      deliveryType: "Truck",
      notes: "Delivers on Mondays and Thursdays early morning.",
      userId,
    },
  });

  const supplierBake = await prisma.supplier.create({
    data: {
      name: "Artisan Baking Co.",
      phone: "+1 (555) 999-8888",
      email: "orders@artisanbaking.com",
      deliveryType: "Courier",
      notes: "Place orders 24 hours in advance.",
      userId,
    },
  });
  console.log("✔ Suppliers seeded");

  console.log("Seeding storage locations...");
  await prisma.storageLocation.create({
    data: { name: "Dry Pantry", notes: "Main pantry shelves", userId },
  });
  await prisma.storageLocation.create({
    data: { name: "Walk-In Fridge 1", notes: "Refrigerated food storage", userId },
  });
  console.log("✔ Storage locations seeded");

  console.log("Seeding ingredient categories...");
  const ingCatProduce = await prisma.ingredientCategory.create({
    data: { name: "Produce", userId },
  });
  await prisma.ingredientSubcategory.create({
    data: { name: "Grains & Pasta", categoryId: ingCatProduce.id },
  });
  console.log("✔ Ingredient categories seeded");

  console.log("Seeding ingredients...");
  const ingredientTomato = await prisma.ingredient.create({
    data: {
      name: "Fresh Roma Tomatoes",
      unit: "kg",
      category: "Produce",
      subcategory: "Vegetables",
      supplier: supplierFresh.name,
      purchaseUnit: "Box",
      purchaseQty: 10,
      unitPrice: 15.0,
      minStock: 5.0,
      notes: "Store in dry storage, not walk-in fridge to maintain taste.",
      userId,
    },
  });

  const ingredientPasta = await prisma.ingredient.create({
    data: {
      name: "Penne Pasta",
      unit: "kg",
      category: "Pantry",
      subcategory: "Grains & Pasta",
      supplier: supplierBake.name,
      purchaseUnit: "Case",
      purchaseQty: 12,
      unitPrice: 24.0,
      minStock: 10.0,
      notes: "Ensure container is sealed to prevent pests.",
      userId,
    },
  });

  const ingredientOliveOil = await prisma.ingredient.create({
    data: {
      name: "Extra Virgin Olive Oil",
      unit: "liters",
      category: "Pantry",
      subcategory: "Oils",
      supplier: supplierFresh.name,
      purchaseUnit: "Bottle",
      purchaseQty: 5,
      unitPrice: 40.0,
      minStock: 2.0,
      userId,
    },
  });
  console.log("✔ Ingredients seeded");

  console.log("Seeding recipe categories...");
  const recipeCategoryMains = await prisma.category.create({
    data: {
      name: "Mains",
      description: "Primary courses and dinner dishes",
      userId,
    },
  });

  const recipeSubcategoryPasta = await prisma.subcategory.create({
    data: {
      name: "Pasta Dishes",
      categoryId: recipeCategoryMains.id,
    },
  });
  console.log("✔ Recipe categories seeded");

  console.log("Seeding recipes...");
  const recipePasta = await prisma.recipe.create({
    data: {
      title: "Tomato & Garlic Penne",
      description: "A classic, simple pasta dish with rich garlic tomato sauce.",
      instructions: "1. Boil pasta for 10 minutes.\n2. In a pan, heat olive oil and cook minced garlic.\n3. Add chopped Roma tomatoes and simmer for 15 minutes.\n4. Toss pasta in the sauce and serve fresh.",
      prepTime: 10,
      cookTime: 15,
      servings: 4,
      difficulty: Difficulty.EASY,
      categoryId: recipeCategoryMains.id,
      subcategoryId: recipeSubcategoryPasta.id,
      userId,
    },
  });

  await prisma.recipeIngredient.create({
    data: {
      quantity: 0.5,
      unit: "kg",
      recipeId: recipePasta.id,
      ingredientId: ingredientPasta.id,
    },
  });

  await prisma.recipeIngredient.create({
    data: {
      quantity: 1.0,
      unit: "kg",
      recipeId: recipePasta.id,
      ingredientId: ingredientTomato.id,
    },
  });

  await prisma.recipeIngredient.create({
    data: {
      quantity: 0.05,
      unit: "liters",
      recipeId: recipePasta.id,
      ingredientId: ingredientOliveOil.id,
    },
  });
  console.log("✔ Recipes seeded");

  console.log("Seeding menus...");
  const menuSummer = await prisma.menu.create({
    data: {
      name: "Summer Pasta Specials",
      description: "Fresh and light dishes for the warm season",
      isActive: true,
      userId,
    },
  });

  await prisma.menuItem.create({
    data: {
      price: 16.99,
      notes: "Serve with fresh grated parmesan cheese.",
      section: "Mains",
      sortOrder: 0,
      menuId: menuSummer.id,
      recipeId: recipePasta.id,
    },
  });
  console.log("✔ Menus seeded");

  console.log("Seeding checklist templates...");
  const checklistTemplateOpen = await prisma.checklistTemplate.create({
    data: {
      name: "Kitchen Morning Opening Checklist",
      type: ChecklistType.OPENING,
      theme: "Kitchen",
      isActive: true,
      userId,
    },
  });

  const openingItems = [
    { label: "Verify all refrigerators are below 4°C", order: 0, required: true },
    { label: "Turn on prep ovens and grills to standby temps", order: 1, required: true },
    { label: "Sanitize all chopping boards and prep counters", order: 2, required: true },
    { label: "Refill sanitizer buckets and handwash stations", order: 3, required: true },
  ];

  for (const item of openingItems) {
    await prisma.checklistTemplateItem.create({
      data: {
        ...item,
        templateId: checklistTemplateOpen.id,
      },
    });
  }
  console.log("✔ Checklist templates seeded");

  console.log("Seeding temperature monitoring devices...");
  const tempDevice = await prisma.tempDevice.create({
    data: {
      name: "Main Kitchen Cold Storage Walk-in",
      location: "Kitchen Back",
      deviceType: TempDeviceType.FRIDGE,
      minTemp: 1.0,
      maxTemp: 4.0,
      targetTemp: 2.5,
      unit: TempUnit.CELSIUS,
      isActive: true,
      notes: "Must be reported twice daily.",
      userId,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.tempLog.create({
    data: {
      deviceId: tempDevice.id,
      date: today,
      temp: 2.3,
      isAutoFilled: false,
      notes: "Morning reading clean.",
      userId,
    },
  });
  console.log("✔ Temperature logs seeded");

  console.log("Seeding sub-accounts...");
  const hashedSubPassword = await bcrypt.hash("manager123", 10);
  await prisma.subAccount.create({
    data: {
      ownerId: userId,
      email: "manager@bistroflow.com",
      password: hashedSubPassword,
      name: "Assistant Manager",
      isActive: true,
      allowedRestaurantIds: [restaurantGrande.id],
      allowedFeatures: ["schedules", "checklists", "temperatures"],
    },
  });
  console.log("✔ Sub-accounts seeded");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
