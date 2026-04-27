const fs = require('fs');

const famousPlayers = [
  { name: "Virat Kohli", role: "Batter", country: "India" },
  { name: "MS Dhoni", role: "Wicket Keeper", country: "India" },
  { name: "Rohit Sharma", role: "Batter", country: "India" },
  { name: "Jasprit Bumrah", role: "Bowler", country: "India" },
  { name: "Hardik Pandya", role: "All-Rounder", country: "India" },
  { name: "Ravindra Jadeja", role: "All-Rounder", country: "India" },
  { name: "KL Rahul", role: "Wicket Keeper", country: "India" },
  { name: "Suryakumar Yadav", role: "Batter", country: "India" },
  { name: "Rishabh Pant", role: "Wicket Keeper", country: "India" },
  { name: "Shubman Gill", role: "Batter", country: "India" },
  { name: "Pat Cummins", role: "Bowler", country: "Australia" },
  { name: "Mitchell Starc", role: "Bowler", country: "Australia" },
  { name: "Glenn Maxwell", role: "All-Rounder", country: "Australia" },
  { name: "David Warner", role: "Batter", country: "Australia" },
  { name: "Steve Smith", role: "Batter", country: "Australia" },
  { name: "Travis Head", role: "Batter", country: "Australia" },
  { name: "Kane Williamson", role: "Batter", country: "New Zealand" },
  { name: "Trent Boult", role: "Bowler", country: "New Zealand" },
  { name: "Rachin Ravindra", role: "All-Rounder", country: "New Zealand" },
  { name: "Ben Stokes", role: "All-Rounder", country: "England" },
  { name: "Jos Buttler", role: "Wicket Keeper", country: "England" },
  { name: "Jofra Archer", role: "Bowler", country: "England" },
  { name: "Jonny Bairstow", role: "Batter", country: "England" },
  { name: "Joe Root", role: "Batter", country: "England" },
  { name: "Kagiso Rabada", role: "Bowler", country: "South Africa" },
  { name: "Quinton de Kock", role: "Wicket Keeper", country: "South Africa" },
  { name: "Heinrich Klaasen", role: "Wicket Keeper", country: "South Africa" },
  { name: "David Miller", role: "Batter", country: "South Africa" },
  { name: "Rashid Khan", role: "Bowler", country: "Afghanistan" },
  { name: "Sunil Narine", role: "All-Rounder", country: "West Indies" },
  { name: "Andre Russell", role: "All-Rounder", country: "West Indies" },
  { name: "Nicholas Pooran", role: "Wicket Keeper", country: "West Indies" },
  { name: "Shakib Al Hasan", role: "All-Rounder", country: "Bangladesh" },
  { name: "Matheesha Pathirana", role: "Bowler", country: "Sri Lanka" },
  { name: "Wanindu Hasaranga", role: "All-Rounder", country: "Sri Lanka" },
  // Adding more players
  { name: "Shreyas Iyer", role: "Batter", country: "India" },
  { name: "Mohammed Shami", role: "Bowler", country: "India" },
  { name: "Mohammed Siraj", role: "Bowler", country: "India" },
  { name: "Ishan Kishan", role: "Wicket Keeper", country: "India" },
  { name: "Sanju Samson", role: "Wicket Keeper", country: "India" },
  { name: "Rinku Singh", role: "Batter", country: "India" },
  { name: "Yashasvi Jaiswal", role: "Batter", country: "India" },
  { name: "Arshdeep Singh", role: "Bowler", country: "India" },
  { name: "Axar Patel", role: "All-Rounder", country: "India" },
  { name: "Yuzvendra Chahal", role: "Bowler", country: "India" },
  { name: "Kuldeep Yadav", role: "Bowler", country: "India" },
  { name: "Ruturaj Gaikwad", role: "Batter", country: "India" },
  { name: "Washington Sundar", role: "All-Rounder", country: "India" },
  { name: "Ravi Ashwin", role: "All-Rounder", country: "India" },
  { name: "Cameron Green", role: "All-Rounder", country: "Australia" },
  { name: "Marcus Stoinis", role: "All-Rounder", country: "Australia" },
  { name: "Josh Hazlewood", role: "Bowler", country: "Australia" },
  { name: "Mitch Marsh", role: "All-Rounder", country: "Australia" },
  { name: "Sam Curran", role: "All-Rounder", country: "England" },
  { name: "Liam Livingstone", role: "All-Rounder", country: "England" },
  { name: "Mark Wood", role: "Bowler", country: "England" },
  { name: "Anrich Nortje", role: "Bowler", country: "South Africa" },
  { name: "Aiden Markram", role: "Batter", country: "South Africa" },
  { name: "Marco Jansen", role: "All-Rounder", country: "South Africa" },
  { name: "Rahmanullah Gurbaz", role: "Wicket Keeper", country: "Afghanistan" },
  { name: "Mujeeb Ur Rahman", role: "Bowler", country: "Afghanistan" },
  { name: "Naveen-ul-Haq", role: "Bowler", country: "Afghanistan" },
  { name: "Rovman Powell", role: "Batter", country: "West Indies" },
  { name: "Alzarri Joseph", role: "Bowler", country: "West Indies" },
  { name: "Jason Holder", role: "All-Rounder", country: "West Indies" },
  { name: "Maheesh Theekshana", role: "Bowler", country: "Sri Lanka" },
  { name: "Mustafizur Rahman", role: "Bowler", country: "Bangladesh" }
];

async function fetchWikiImage(playerName) {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(playerName)}&prop=pageimages&format=json&pithumbsize=500`;
        const response = await fetch(url);
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId !== "-1" && pages[pageId].thumbnail) {
            return pages[pageId].thumbnail.source;
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function generate() {
    console.log("Fetching real player images from Wikipedia...");
    const players = [];
    
    // We will generate 220 players total. 
    // The first ~67 will be the real famous players with Wiki images.
    // The rest will be randomly generated to fill the pool.

    let idCounter = 1;

    for (const fp of famousPlayers) {
        console.log(`Fetching image for ${fp.name}...`);
        let imageUrl = await fetchWikiImage(fp.name);
        
        // If no image is found on wiki, try adding "(cricketer)"
        if (!imageUrl) {
             imageUrl = await fetchWikiImage(`${fp.name} (cricketer)`);
        }

        // Fallback generic silhouette if completely unfound
        if (!imageUrl) {
            imageUrl = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
        }

        let bp = fp.name === "Virat Kohli" || fp.name === "MS Dhoni" || fp.name === "Pat Cummins" || fp.name === "Mitchell Starc" ? 200 : 100;
        if(Math.random() > 0.5) bp = 150;

        players.push({
            id: idCounter++,
            name: fp.name,
            role: fp.role,
            nationality: fp.country === "India" ? "Indian" : "Overseas",
            basePrice: bp,
            image: imageUrl
        });
        
        // Slight delay to be nice to Wiki API
        await new Promise(r => setTimeout(r, 200));
    }

    // Now fill the rest to reach 150
    console.log("Generating remaining domestic/uncapped players...");
    const firstNames = ['Abhishek', 'Prabhsimran', 'Sai', 'Kartik', 'Ayush', 'Mohsin', 'Yash', 'Vidwath', 'Suyash', 'Nehal', 'Akash', 'Kumar', 'Mayank', 'Navdeep', 'Tushar', 'Vaibhav', 'Ramandeep', 'Anshul', 'Naman', 'Harshit', 'Vijaykumar', 'Manish', 'Kedar', 'Piyush', 'Amit', 'Ishant', 'Umesh', 'Sandeep', 'Mohit', 'Jaydev', 'Krunal', 'Deepak', 'Karn', 'Mandeep', 'Karun', 'Siddarth', 'Shahbaz', 'KS', 'Ricky', 'Samarth', 'Aryan', 'Raj', 'Yash', 'Darshan', 'Vivrant', 'Mayank', 'Upendra', 'Nishant', 'Sanvir', 'Hrithik', 'Yudhvir', 'Prerak', 'Manoj', 'Shashank', 'Ashutosh', 'Ramandeep', 'Sumit', 'Swastik', 'Angkrish', 'Abishek', 'Shivalik', 'Sameer', 'Naman', 'Saurav', 'Arshad', 'Piyush', 'Karthik', 'Praveen', 'Vidyadhar', 'Sachin', 'Ankit', 'Manav', 'Gaurav', 'Bhanu', 'Rohan', 'Guntash', 'Vipraj', 'Rohan', 'Aman', 'Himanshu', 'Prashant', 'Prakhar'];
    const lastNames = ['Singh', 'Sharma', 'Patel', 'Kumar', 'Yadav', 'Gupta', 'Iyer', 'Khan', 'Jain', 'Reddy', 'Rao', 'Nair', 'Menon', 'Pillai', 'Das', 'Sen', 'Bose', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Ahuja', 'Kapur', 'Malhotra', 'Bhatia', 'Chopra', 'Sethi', 'Mehra', 'Tandon', 'Verma', 'Mishra', 'Pandey', 'Shukla', 'Dubey', 'Tiwari', 'Tripathi', 'Chauhan', 'Rajput', 'Rathore', 'Shekhawat', 'Gaikwad', 'Jadhav', 'Deshmukh', 'Patil', 'Kadam', 'Pawar', 'More', 'Chavan', 'Gowda', 'Shetty', 'Bhat', 'Hegde', 'Karanth', 'Kini', 'Shenoy', 'Baliga', 'Kamat', 'Prabhu', 'Bhandari', 'Poojary', 'Naik', 'Nayak', 'Rai', 'Chowdhury', 'Dutta', 'Sarkar', 'Ghosh'];
    
    while(idCounter <= 220) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${fn} ${ln}`;
        
        const roles = ['Batter', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
        const role = roles[Math.floor(Math.random() * roles.length)];
        const imageUrl = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

        players.push({
            id: idCounter++,
            name: name,
            role: role,
            nationality: "Indian",
            basePrice: 20, // Uncapped base price
            image: imageUrl
        });
    }

    fs.writeFileSync('players.json', JSON.stringify(players, null, 2));
    console.log('Successfully created players.json with real images!');
}

generate();
