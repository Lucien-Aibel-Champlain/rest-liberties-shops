# LibertyShops API Documentation

All endpoints accessable through https://rest-liberties-shops.libertiesshops.workers.dev/

## Endpoints

Endpoints are added to the base URL to access a specific feature of the API. For example, adding /stores to the base URL gets you https://rest-liberties-shops.libertiesshops.workers.dev/stores, which will get information about stores

### GET endpoints

Request information about a category of data. There are three exposed endpoints:

/items --lists items stocked anywhere
/categories --lists all categories of item
/stores --lists all stores

### POST endpoint

There is one POST endpoint, which allows submission of new items.

/items

It expects four fields in a JSON message
"itemName" - a string name for the item
"price" - the price, in euro cents. So the price in euro * 100, in order to remove decimals
"storeID" - an integer specifier for which store the item belongs to. Items can only have one store.
"categoryID" - an integer specifier for which category the item belongs to.

So a sample body for a POST to /items would look like: 
{"itemName":"Apple", "price":250, "storeID":1, "categoryID":5}

## Filters

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
item= (filters by item name)
category= (filters by item category)
store= (filters by store name)
```

All are submitted to the database surrounded by wildcards, so "store=Fa" will match a store called Fadlan's or Alfa's or whatever with 'fa' in its name somewhere

If multiple filters of the same type are submitted, either is considered a match
```
item=Apple&item=Banana will match either Apple or Bannana)
```

But filters of different types must all match 

```
item=Apple&category=Produce will need an item called Apple in the category Produce, not any produce or any item called Apple)
```
