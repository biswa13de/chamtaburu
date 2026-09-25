const V="veg",E="egg",N="nonveg";
window.MENU=[
 {id:"package",t:"Package meals",note:"Our simplest option: a complete day's meals, planned by our kitchen.",feature:true,items:[
  ["Veg meal package",650,V],["Non-veg meal package",700,N]]},
 {
  id:"breakfast",t:"Breakfast",note:"Served 7:30 – 10:30 am",
  items:[
    ["Puri sabji","4 pcs",80,V],
    ["Alu paratha","2 pcs",110,V],
    ["Gobi paratha","2 pcs",140,V],
    ["Paneer paratha","2 pcs",150,V],
    ["Chole bhature","2 pcs",90,V],
    ["Bread omelette","2 pcs",70,E],
    ["Butter toast","2 pcs",50,V],
    ["Fried papad",30,V]
  ],
  foot:"Extra puri ₹15 per piece."
},
 {
  id:"thali",t:"Thali",note:"A full plate with rice, dal and sides.",
  items:[
    ["Special veg thali",180,V],
    ["Egg thali",210,E],
    ["Fish thali",240,N],
    ["Chicken thali",260,N],
    ["Desi chicken thali",370,N],
    ["Mutton thali",450,N]
]},
 {
  id:"posto",t:"Posto specials",note:"Bengal's beloved poppy-seed dishes.",
  items:[
    ["Alu posto",160,V],
    ["Posto bora","4 pcs",180,V],
    ["Posto bata",450,V],
    ["Egg posto","2 pcs",100,E],
    ["Fish posto","2 pcs",170,N]
  ]
  },
 {id:"starters",t:"Starters",
  items:[
    ["Finger chips",130,V],
    ["Onion pakoda",110,V],
    ["Veg pakoda",120,V],
    ["Paneer pakoda",200,V],
    ["Chana dry fry",110,V],
    ["Chana chilli",120,V],
    ["Potato chilli",120,V],
    ["Paneer chilli",210,V],
    ["Chicken pakoda","12 pcs",200,N],
    ["Chicken dry fry","12 pcs",200,N],
    ["Chicken chilli",210,N]
  ]},
 {
  id:"veg-mains",t:"Vegetarian mains",
  items:[
    ["Alu chokha",80,V],
    ["Mix chokha",90,V],
    ["Alu dum",90,V],
    ["Plain tadka",90,V],
    ["Chana masala",140,V],
    ["Mix veg",140,V],
    ["Paneer masala",190,V],
    ["Paneer butter masala",220,V],
    ["Matar paneer",220,V],
    ["Egg tadka",130,E]
  ]},
 {
  id:"nonveg-mains",t:"Chicken & mutton",
  items:[
    ["Chicken curry",210,N],
    ["Chicken kosa",220,N],
    ["Desi chicken",290,N],
    ["Mutton curry",350,N]
  ]
},
 {id:"fish",t:"Fish",items:[
  ["Fish dry fry","2 pcs",90,N],
  ["Fish curry","2 pcs",120,N],
  ["Fish masala","2 pcs",140,N]
 ]},
 {id:"egg",t:"Eggs",items:[
  ["Boiled egg","2 pcs",40,E],
  ["Egg poach","2 pcs",50,E],
  ["Egg omelette","2 pcs",60,E],
  ["Egg bhurji","2 pcs",70,E],
  ["Egg curry","2 pcs",80,E],
  ["Egg fry masala","2 pcs",80,E]
 ]},
 {
  id:"dal",t:"Dal",
  items:[
    ["Plain dal",40,V],
    ["Yellow dal fry",70,V],
    ["Chana dal fry",80,V],
    ["Tadka dal fry",90,V]
  ]},
 {
  id:"rice",t:"Rice",
  items:[
    ["Plain rice",50,V],
    ["Steamed rice",80,V],
    ["Lemon rice",80,V],
    ["Jeera rice",80,V],
    ["Veg fried rice",120,V]
  ]},
 {
  id:"roti",t:"Roti",
  items:[
    ["Tawa roti",10,V],
    ["Tawa butter roti",20,V],
    ["Tawa ghee roti",20,V]
  ]},
 {
  id:"noodles",t:"Noodles",
  items:[
    ["Veg chowmein",130,V],
    ["Egg chowmein",170,E],
    ["Chicken chowmein",210,N]
  ]},
 {
  id:"salad",t:"Salad",
  items:[
    ["Mix salad",90,V],
    ["Green salad","1 plate",90,V]
  ]},
 {
  id:"sweets",t:"Sweets & curd",
  items:[
    ["Sandesh or rasogolla","1 pc",20,V],
    ["Curd",50,V]
  ]},
 {
  id:"drinks",t:"Hot drinks",
  items:[
    ["Tea",30,V],
    ["Coffee",40,V],
    ["Hot milk",60,V]
  ]}
];
