CREATE TABLE IF NOT EXISTS Categories (
 	categoryID INTEGER PRIMARY KEY AUTOINCREMENT,
 	categoryName TEXT,
 	parentCategoryID INTEGER,
 	FOREIGN KEY (parentCategoryID) REFERENCES Stores(categoryID) --note that this is required for all entries. standard protocol is to have the first category be "All" and its parent is its own ID. Top-level categories have All as a parent.
);

CREATE TABLE IF NOT EXISTS Stores (
 	storeID INTEGER PRIMARY KEY AUTOINCREMENT,
 	storeName TEXT,
 	description TEXT,
 	website TEXT,
 	address TEXT,
 	latitude INTEGER, --multipy by 1000000 to turn a six-digit-precision decimal into a integer
 	longitude INTEGER, --multipy by 1000000 to turn a six-digit-precision decimal into a integer
);

CREATE TABLE IF NOT EXISTS Items (
 	itemID INTEGER PRIMARY KEY AUTOINCREMENT,
 	itemName TEXT,
 	price INTEGER, --always in cents, so there's never a decimal
 	storeID INTEGER,
 	categoryID INTEGER,
 	FOREIGN KEY (storeID) REFERENCES Stores(storeID)
 	FOREIGN KEY (categoryID) REFERENCES Categories(categoryID)
);
