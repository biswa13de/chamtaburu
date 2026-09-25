const V="veg",E="egg",N="nonveg";
window.MENU=[
 {id:"package",t:"Package meals",note:"Our simplest option: a complete day's meals, planned by our kitchen.",feature:true,items:[
  ["Veg meal package",550,V],["Non-veg meal package",650,N]]},
 {id:"breakfast",t:"Breakfast",note:"Served 7:30 – 10:30 am",items:[
  ["Puri sabji","4 pcs",60,V],["Alu paratha","2 pcs",70,V],["Gobi paratha","2 pcs",80,V],["Paneer paratha","2 pcs",130,V],
  ["Chole bhature","2 pcs",60,V],["Bread omelette","2 pcs",60,E],["Butter toast","2 pcs",40,V],["Fried papad",20,V]],
  foot:"Extra puri ₹10 per piece."},
 {id:"thali",t:"Thali",note:"A full plate with rice, dal and sides.",items:[
  ["Special veg thali",150,V],["Egg thali",180,E],["Fish thali",210,N],["Chicken thali",220,N],["Desi chicken thali",350,N],["Mutton thali",400,N]]},
 {id:"posto",t:"Posto specials",note:"Bengal's beloved poppy-seed dishes.",items:[
  ["Alu posto",160,V],["Posto bora","4 pcs",180,V],["Posto bata",450,V],["Egg posto","2 pcs",100,E],["Fish posto","2 pcs",170,N]]},
 {id:"starters",t:"Starters",items:[
  ["Finger chips",110,V],["Onion pakoda",110,V],["Veg pakoda",120,V],["Paneer pakoda",160,V],["Chana dry fry",110,V],
  ["Chana chilli",120,V],["Potato chilli",100,V],["Paneer chilli",170,V],
  ["Chicken pakoda","12 pcs",160,N],["Chicken dry fry","12 pcs",170,N],["Chicken chilli",170,N]]},
 {id:"veg-mains",t:"Vegetarian mains",items:[
  ["Alu chokha",70,V],["Mix chokha",80,V],["Alu dum",80,V],["Plain tadka",90,V],["Chana masala",110,V],["Mix veg",120,V],
  ["Paneer masala",160,V],["Paneer butter masala",180,V],["Matar paneer",190,V],["Egg tadka",120,E]]},
 {id:"nonveg-mains",t:"Chicken & mutton",items:[
  ["Chicken curry",170,N],["Chicken kosa",180,N],["Desi chicken",250,N],["Mutton curry",300,N]]},
 {id:"fish",t:"Fish",items:[
  ["Fish dry fry","2 pcs",90,N],["Fish curry","2 pcs",120,N],["Fish masala","2 pcs",140,N]]},
 {id:"egg",t:"Eggs",items:[
  ["Boiled egg","2 pcs",40,E],["Egg poach","2 pcs",40,E],["Egg omelette","2 pcs",50,E],["Egg bhurji","2 pcs",60,E],
  ["Egg curry","2 pcs",70,E],["Egg fry masala","2 pcs",70,E]]},
 {id:"dal",t:"Dal",items:[
  ["Plain dal",40,V],["Yellow dal fry",60,V],["Chana dal fry",70,V],["Tadka dal fry",90,V]]},
 {id:"rice",t:"Rice",items:[
  ["Plain rice",50,V],["Steamed rice",70,V],["Lemon rice",70,V],["Jeera rice",80,V],["Veg fried rice",110,V]]},
 {id:"roti",t:"Roti",items:[
  ["Tawa roti",10,V],["Tawa butter roti",20,V],["Tawa ghee roti",20,V]]},
 {id:"noodles",t:"Noodles",items:[
  ["Veg chowmein",110,V],["Egg chowmein",140,E],["Chicken chowmein",170,N]]},
 {id:"salad",t:"Salad",items:[
  ["Mix salad",70,V],["Green salad","1 plate",80,V]]},
 {id:"sweets",t:"Sweets & curd",items:[
  ["Sandesh or rasogolla","1 pc",20,V],["Curd",40,V]]},
 {id:"drinks",t:"Hot drinks",items:[
  ["Tea",30,V],["Coffee",40,V],["Hot milk",60,V]]}
];
