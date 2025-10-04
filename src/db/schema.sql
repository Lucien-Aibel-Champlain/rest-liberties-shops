CREATE TABLE IF NOT EXISTS Categories (
 	categoryID INTEGER PRIMARY KEY AUTOINCREMENT,
 	categoryName TEXT
);

CREATE TABLE IF NOT EXISTS Stores (
 	storeID INTEGER PRIMARY KEY AUTOINCREMENT,
 	storeName TEXT,
 	description TEXT,
 	website TEXT,
 	address TEXT
);

CREATE TABLE IF NOT EXISTS Items (
 	itemID INTEGER PRIMARY KEY AUTOINCREMENT,
 	itemName TEXT,
 	price INTEGER,
 	storeID INTEGER,
 	categoryID INTEGER,
 	FOREIGN KEY (storeID) REFERENCES Stores(storeID)
 	FOREIGN KEY (categoryID) REFERENCES Categories(categoryID)
);
