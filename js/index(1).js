document.addEventListener("DOMContentLoaded",async () =>{
    const quo=document.getElementById("quote");
    try{
        const response=await fetch("https://dummyjson.com/quotes");
        const data =await response.json();
        const quotes=data.quotes;

        let curID=0;
        const displayQuote = function() {
    const { quote, author } = quotes[curID];
    quo.textContent = `"${quote}" - ${author}`;
    curID = (curID + 1) % quotes.length;
};
        displayQuote();
        setInterval(displayQuote,20000);
    }
    catch(error){
        console.error("Check Api::",error);
    }
})