INSERT INTO Categories (categoryName) VALUES ("Produce"), ("Dairy"), ("Meat");
INSERT INTO Types (typeName) VALUES ("Grocery"), ("Restaurant"), ("Pub"), ("Hardware"), ("Home Goods"), ("Chain");
INSERT INTO Stores (storeName, description, website, address, latitude, longitude) VALUES ("Jeremy's Test House", "", "", "", 0, 0), ("Bobby's Chalk Shalk", "", "", "", 0, 0);
INSERT INTO StoreTypes (storeID, typeID) VALUES (1, 1), (1, 2), (2,4);
INSERT INTO Items (itemName, price, storeID, categoryID) VALUES ("Chalk", 100, 2, 3), ("Better Chalk", 250, 2, 3), ("Apple", 120, 1, 1), ("Cheese", 700, 1, 2), ("Chalk", 150, 1,3);
