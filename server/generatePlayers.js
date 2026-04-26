const fs = require('fs');

const roles = ['Batter', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
const nationalities = ['Indian', 'Overseas'];

// Base names for random generation
const firstNames = ['Virat', 'Rohit', 'MS', 'Hardik', 'Jasprit', 'Ravindra', 'Rishabh', 'KL', 'Shubman', 'Suryakumar', 'Shreyas', 'Ishan', 'Sanju', 'Yuzvendra', 'Kuldeep', 'Mohammed', 'Bhuvneshwar', 'Deepak', 'Shardul', 'Washington', 'Axar', 'Ravi', 'Prithvi', 'Ruturaj', 'Devdutt', 'Venkatesh', 'Rahul', 'Nitish', 'Varun', 'Avesh', 'Harshal', 'Umran', 'Arshdeep', 'Mukesh', 'Rajat', 'Tilak', 'Rinku', 'Yashasvi', 'Shivam', 'Jitesh', 'Dhruv', 'Sarfaraz', 'Shahrukh', 'Rahul', 'Abhishek', 'Prabhsimran', 'Sai', 'Kartik', 'Ayush', 'Mohsin', 'Yash', 'Vidwath', 'Suyash', 'Nehal', 'Akash', 'Kumar', 'Mayank', 'Navdeep', 'Tushar', 'Vaibhav', 'Ramandeep', 'Anshul', 'Naman', 'Harshit', 'Vijaykumar', 'Manish', 'Kedar', 'Piyush', 'Amit', 'Ishant', 'Umesh', 'Sandeep', 'Mohit', 'Jaydev', 'Krunal', 'Deepak', 'Karn', 'Mandeep', 'Karun', 'Siddarth', 'Shahbaz', 'KS', 'Ricky', 'Samarth', 'Aryan', 'Raj', 'Yash', 'Darshan', 'Vivrant', 'Mayank', 'Upendra', 'Nishant', 'Sanvir', 'Hrithik', 'Yudhvir', 'Prerak', 'Manoj', 'Shashank', 'Ashutosh', 'Ramandeep', 'Sumit', 'Swastik', 'Angkrish', 'Abishek', 'Shivalik', 'Sameer', 'Naman', 'Saurav', 'Arshad', 'Piyush', 'Karthik', 'Praveen', 'Vidyadhar', 'Sachin', 'Ankit', 'Manav', 'Gaurav', 'Bhanu', 'Rohan', 'Guntash', 'Vipraj', 'Rohan', 'Aman', 'Himanshu', 'Prashant', 'Prakhar'];
const foreignFirstNames = ['David', 'Steve', 'Glenn', 'Pat', 'Mitchell', 'Josh', 'Marcus', 'Matthew', 'Travis', 'Cameron', 'Aaron', 'Kane', 'Trent', 'Tim', 'Lockie', 'Devon', 'Daryl', 'Mitchell', 'Rachin', 'Jos', 'Jonny', 'Ben', 'Joe', 'Sam', 'Moeen', 'Liam', 'Jofra', 'Mark', 'Reece', 'Phil', 'Will', 'Harry', 'Quinton', 'Kagiso', 'Anrich', 'David', 'Aiden', 'Heinrich', 'Marco', 'Lungi', 'Tabraiz', 'Keshav', 'Tristan', 'Dewald', 'Donovan', 'Nandre', 'Gerald', 'Rashid', 'Mohammad', 'Rahmanullah', 'Noor', 'Fazalhaq', 'Mujeeb', 'Naveen', 'Azmatullah', 'Gulbadin', 'Kieron', 'Andre', 'Sunil', 'Nicholas', 'Rovman', 'Jason', 'Kyle', 'Romario', 'Alzarri', 'Obed', 'Akeal', 'Sherfane', 'Shai', 'Brandon', 'Shamar', 'Matheesha', 'Maheesh', 'Wanindu', 'Dushmantha', 'Dasun', 'Bhanuka', 'Charith', 'Pathum', 'Kusal', 'Dilshan', 'Nuwan', 'Shakib', 'Mustafizur', 'Litton', 'Taskin', 'Towhid', 'Najmul', 'Mehidy', 'Sikandar', 'Richard', 'Blessing', 'Craig', 'Sean', 'Ryan', 'Colin', 'Paul', 'Curtis', 'Joshua', 'Gareth', 'Lorcan', 'Mark', 'Andy', 'Sandeep', 'Sompal', 'Dipendra', 'Kushal', 'Aasif', 'Rohit', 'Ali', 'Zeeshan', 'Rohan', 'Karthik', 'Saurabh'];
const lastNames = ['Singh', 'Sharma', 'Patel', 'Kumar', 'Yadav', 'Gupta', 'Iyer', 'Khan', 'Jain', 'Reddy', 'Rao', 'Nair', 'Menon', 'Pillai', 'Das', 'Sen', 'Bose', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Ahuja', 'Kapur', 'Malhotra', 'Bhatia', 'Chopra', 'Sethi', 'Mehra', 'Tandon', 'Verma', 'Mishra', 'Pandey', 'Shukla', 'Dubey', 'Tiwari', 'Tripathi', 'Chauhan', 'Rajput', 'Rathore', 'Shekhawat', 'Gaikwad', 'Jadhav', 'Deshmukh', 'Patil', 'Kadam', 'Pawar', 'More', 'Chavan', 'Gowda', 'Shetty', 'Bhat', 'Hegde', 'Karanth', 'Kini', 'Shenoy', 'Baliga', 'Kamat', 'Prabhu', 'Bhandari', 'Poojary', 'Naik', 'Nayak', 'Rai', 'Chowdhury', 'Dutta', 'Sarkar', 'Ghosh', 'Biswas', 'Mallick', 'Roy', 'Saha', 'Karmakar', 'Pramanik', 'Barman', 'Debnath', 'Bhowmick', 'Talukdar', 'Majumdar', 'Haldar', 'Sardar', 'Molla', 'Sheikh', 'Bhuiyan', 'Rahman', 'Ali', 'Hossain', 'Islam', 'Ahmed', 'Kazi', 'Mandal', 'Giri', 'Bera', 'Maity', 'Jana', 'Samanta', 'Kar', 'De', 'Pal', 'Basu', 'Datta', 'Mitra', 'Guha', 'Rakshit', 'Nandi', 'Chanda', 'Kundu'];
const foreignLastNames = ['Warner', 'Smith', 'Maxwell', 'Cummins', 'Starc', 'Hazlewood', 'Stoinis', 'Wade', 'Head', 'Green', 'Finch', 'Williamson', 'Boult', 'Southee', 'Ferguson', 'Conway', 'Mitchell', 'Santner', 'Ravindra', 'Buttler', 'Bairstow', 'Stokes', 'Root', 'Curran', 'Ali', 'Livingstone', 'Archer', 'Wood', 'Topley', 'Salt', 'Jacks', 'Brook', 'de Kock', 'Rabada', 'Nortje', 'Miller', 'Markram', 'Klaasen', 'Jansen', 'Ngidi', 'Shamsi', 'Maharaj', 'Stubbs', 'Brevis', 'Ferreira', 'Burger', 'Coetzee', 'Khan', 'Nabi', 'Gurbaz', 'Ahmad', 'Farooqi', 'Zadran', 'ul-Haq', 'Omarzai', 'Naib', 'Pollard', 'Russell', 'Narine', 'Pooran', 'Powell', 'Holder', 'Mayers', 'Shepherd', 'Joseph', 'McCoy', 'Hosein', 'Rutherford', 'Hope', 'King', 'Joseph', 'Pathirana', 'Theekshana', 'Hasaranga', 'Chameera', 'Shanaka', 'Rajapaksa', 'Asalanka', 'Nissanka', 'Mendis', 'Madushanka', 'Thushara', 'Al Hasan', 'Rahman', 'Das', 'Ahmed', 'Hridoy', 'Shanto', 'Hasan', 'Raza', 'Ngarava', 'Muzarabani', 'Ervine', 'Williams', 'Burl', 'Stirling', 'Balbirnie', 'Campher', 'Little', 'Delany', 'Dockrell', 'Adair', 'McBrine', 'Lamichhane', 'Kami', 'Airee', 'Malla', 'Sheikh', 'Paudel', 'Khan', 'Maqsood', 'Ilyas', 'Mustafa', 'Meiyappan', 'Aravind', 'Netravalkar', 'Patel', 'Jones', 'Taylor', 'Kenjige'];

const getRoleImage = (role, id) => {
    // Generate different colored generic avatar placeholders based on role and id
    const colors = {
        'Batter': '1e3a8a', // Blue
        'Bowler': '166534', // Green
        'All-Rounder': '854d0e', // Gold
        'Wicket Keeper': '991b1b' // Red
    };
    const c = colors[role];
    return `https://ui-avatars.com/api/?name=${id}&background=${c}&color=fff&size=500&font-size=0.33`;
};

const players = [];

// Base prices in Lakhs
const basePrices = [20, 50, 100, 150, 200];

for (let i = 1; i <= 250; i++) {
    const isForeign = Math.random() > 0.65; // ~35% foreign
    const nationality = isForeign ? 'Overseas' : 'Indian';
    
    let fn = isForeign ? foreignFirstNames[Math.floor(Math.random() * foreignFirstNames.length)] : firstNames[Math.floor(Math.random() * firstNames.length)];
    let ln = isForeign ? foreignLastNames[Math.floor(Math.random() * foreignLastNames.length)] : lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Some star players first 20
    if (i <= 20) {
        fn = i % 2 === 0 ? firstNames[Math.floor(Math.random() * 5)] : foreignFirstNames[Math.floor(Math.random() * 5)];
        ln = i % 2 === 0 ? lastNames[Math.floor(Math.random() * 5)] : foreignLastNames[Math.floor(Math.random() * 5)];
    }

    const name = `${fn} ${ln}`;
    
    // Assign sets (categories)
    const roleMap = [
        ...Array(40).fill('Batter'), // 100
        ...Array(40).fill('Bowler'), // 100
        ...Array(15).fill('All-Rounder'), // 30
        ...Array(5).fill('Wicket Keeper') // 20
    ];
    
    const role = roleMap[Math.floor(Math.random() * roleMap.length)];
    
    // Higher base price for early players
    let bp = basePrices[Math.floor(Math.random() * basePrices.length)];
    if(i <= 20) bp = 200;
    else if(i <= 50) bp = Math.random() > 0.5 ? 100 : 150;
    else if(i > 150) bp = 20;

    players.push({
        id: i,
        name: name,
        role: role,
        nationality: nationality,
        basePrice: bp,
        image: getRoleImage(role, name.replace(' ', '+'))
    });
}

// Write to file
fs.writeFileSync('players.json', JSON.stringify(players, null, 2));
console.log('Created 250 players in players.json');
