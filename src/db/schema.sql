DROP TABLE Items;
DROP TABLE StoreTypes;
DROP TABLE Stores;
DROP TABLE Types;
DROP TABLE Categories;

--types go to stores, categories go to items
CREATE TABLE IF NOT EXISTS Categories (
 	categoryID INTEGER PRIMARY KEY AUTOINCREMENT,
 	categoryName TEXT
);

CREATE TABLE IF NOT EXISTS Types (
 	typeID INTEGER PRIMARY KEY AUTOINCREMENT,
 	typeName TEXT
);

CREATE TABLE IF NOT EXISTS Stores (
 	storeID INTEGER PRIMARY KEY AUTOINCREMENT,
 	storeName TEXT,
 	description TEXT,
 	website TEXT,
 	address TEXT,
 	latitude INTEGER, --multipy by 1000000 to turn a six-digit-precision decimal into a integer
 	longitude INTEGER --multipy by 1000000 to turn a six-digit-precision decimal into a integer
);

CREATE TABLE IF NOT EXISTS StoreTypes (
	storeID INTEGER,
	typeID INTEGER,
	PRIMARY KEY (storeID, typeID)
 	FOREIGN KEY (storeID) REFERENCES Stores(storeID)
 	FOREIGN KEY (typeID) REFERENCES Types(typeID)
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

CREATE TABLE IF NOT EXISTS Sightings (
	sightingID INTEGER PRIMARY KEY AUTOINCREMENT,
	sightingTime INTEGER,
	itemID INTEGER,
	boolWasThere INTEGER,
	FOREIGN KEY (itemID) REFERENCES Items(itemID)
);
