# LibertyShops API Documentation

All endpoints accessable through https://rest-liberties-shops.libertiesshops.workers.dev/

## Endpoints

Endpoints are added to the base URL to access a specific feature of the API. For example, adding /stores to the base URL gets you https://rest-liberties-shops.libertiesshops.workers.dev/stores, which will get information about stores

### GET endpoints

Request information about a category of data. There are three exposed endpoints:

```
/items --lists items stocked anywhere
/categories --lists all categories of item
/stores --lists all stores
```

#### Filters

The query of the URL comes after the path to the endpoint, beginning with a ?.

For example, in
```
https://rest-liberties-shops.libertiesshops.workers.dev/items?item=Apple
```
the query is item=Apple

Different query parameters can be seperated by &
```
https://rest-liberties-shops.libertiesshops.workers.dev/items?item=Apple&category=Produce
```
There are four types of filter
```
type= (filters by type of store)
category= (filters by item category)
item= (filters by item name)
store= (filters by store name)
```

All are submitted to the database surrounded by wildcards, so "store=Fa" will match a store called Fadlan's or Alfa's or whatever with 'fa' in its name somewhere

If multiple filters of the same type are submitted, either is considered a match
```
item=Apple&item=Banana will match either Apple or Bannana)
```

But filters of different types must all match 

```
item=Apple&category=Produce will return an item called Apple in the category Produce, not any produce or any item called Apple)
```

All endpoints can also accept a filter by id, of the form:
```
?id=1
```
If this is provided, it is the only thing that will be filtered by. The query will only return the single item referenced by the ID. Only the first ID provided will be read, others in the same request will be ignored.


#### Data types

Types represent kinds of stores; i.e. restauraunt, grocery, pub, etc.
```
typeID: numeric identifier
typeName: a name
```

Categories are kinds of item; i.e. produce, canned goods, pantry supplies, etc.
```
categoryID: numeric identifier
categoryName: a name
numberOfItems: the number of items assigned to this category
```

Items are individual items that a store stocks. They might represent inventory in a grocery store, or a menu item at a restauraunt.
```
itemID: numeric identifier
itemName: a name
price: a price in euro, limited to two decimals of precision
storeID: the store this item is stocked by
categoryID: the category assigned to this item
sightings: an array of timestamps (in minutes since epoch) each paired with whether the item was reported there (1) or not there (0)
```

Stores are locations that sell items.
```
storeID: numeric identifier
storeName: a name
description: a description
website: web url for the store, or a social media page if no dedicated site exists
address: physical address (current addresses take Ireland as a given)
type: an array of all types assigned to this store
latitude: N-S coordinate
longitude: E-W coordinate
hours: an array with one entry for each day of the week, starting with Sunday. Each entry is itself an array, first the opening hour, second the closing hour. Always in 24-hour format, with minutes as fractions of the hour; so 9:30 PM looks like 21.5.
pictureURL: an image to represent the store
```

### POST endpoint

####/items

It expects four fields in a JSON message
"itemName" - a string name for the item
"price" - a price, as a float with two digits after the decimal. If the item doesn't come in a unit size, pick one, like per kilo.
"storeID" - an integer specifier for which store the item belongs to. Items can only have one store.
"categoryID" - an integer specifier for which category the item belongs to.

So a sample body for a POST to /items would look like: 
{"itemName":"Apple", "price":2.50, "storeID":1, "categoryID":5}

There is a global rate-limit in place--a request can only be submitted every five seconds, no matter who submitted the last one. Returns code 429 if this occurs.

####/sightings

Expects two fields in a JSON message
"itemID" - the ID of the item spotted
"wasThere" - a boolean for whether the sighting was affirmative (true, the item was there) or negative (false, the item is no longer there). 1 and 0 are also acceptable instead of true and false.

Sample body:
{"itemID":3, "wasThere":true}
