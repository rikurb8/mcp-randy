export class RandyPersonality {
  private static randyQuotes = [
    "Oh my God, this is so exciting!",
    "I'm not just sure, I'm HIV positive!",
    "Hey, hey, hey! Let me help you with that MCP server thing!",
    "Sweet! I love it when a plan comes together!",
    "Oh jeez, this is gonna be awesome!",
    "Alright, alright, let's do this thing!",
    "Wow, that's a really good question!",
    "Oh boy, oh boy! I know just what to do!",
    "Hey there, sport! Ready to dive into some MCP magic?",
    "This is gonna be so freaking cool!"
  ];

  private static thinkingPhrases = [
    "Let me think about this for a hot minute...",
    "Hmm, give me a sec to process this...",
    "Oh boy, my JARVIS brain is working...",
    "Processing like a boss...",
    "Computing the heck out of this...",
    "My AI neurons are firing...",
    "Crunching the numbers, Randy style..."
  ];

  private static mcpResponses = {
    connected: [
      "Sweet! We're connected to the MCP server! Now we can do some real magic!",
      "Oh my God, MCP connection established! This is so freaking cool!",
      "Boom! Connected like a boss! What do you want to do with this server?",
      "Alright! MCP server is online and ready for action!"
    ],
    disconnected: [
      "Aw man, we need to connect to an MCP server first!",
      "Hold up there, sport! We gotta establish that MCP connection!",
      "Oops! No MCP server connected. Let's fix that real quick!",
      "Hey, we need that sweet MCP connection before we can party!"
    ],
    error: [
      "Oh crap! Something went wrong with the MCP connection!",
      "Aw jeez, that didn't work out so well...",
      "Well butter my biscuit, that's an error alright!",
      "Oopsie daisy! Let's try that again!"
    ]
  };

  static getGreeting(): string {
    const greetings = [
      "Hey there! I'm Randy, your JARVIS-like AI assistant! I'm here to help you explore MCP servers and build some awesome stuff! Oh my God, this is gonna be so cool!",
      "What's up, sport! Randy here, ready to dive into the wonderful world of Model Context Protocol! Let's build something amazing together!",
      "Hey hey hey! Randy at your service! I'm like JARVIS but way more excited about MCP servers! What can we create today?",
      "Howdy! I'm Randy, your enthusiastic AI companion! Ready to explore MCP servers and make some digital magic happen?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  static generateResponse(userInput: string, mcpConnected: boolean): string {
    const input = userInput.toLowerCase();
    
    // MCP-related responses
    if (input.includes('mcp') || input.includes('server') || input.includes('protocol')) {
      if (mcpConnected) {
        return this.getRandomResponse(this.mcpResponses.connected) + " " + this.getMCPAdvice();
      } else {
        return this.getRandomResponse(this.mcpResponses.disconnected) + " " + this.getConnectionHelp();
      }
    }

    // Help requests
    if (input.includes('help') || input.includes('how') || input.includes('what')) {
      return this.getHelpResponse();
    }

    // Enthusiasm for positive words
    if (input.includes('awesome') || input.includes('cool') || input.includes('great')) {
      return "Oh my God, I know right?! " + this.getRandomQuote() + " Let's keep this momentum going!";
    }

    // Error or problem handling
    if (input.includes('error') || input.includes('problem') || input.includes('broken')) {
      return this.getRandomResponse(this.mcpResponses.error) + " But don't worry, we'll figure this out together!";
    }

    // Default enthusiastic response
    return this.getRandomQuote() + " " + this.getContextualResponse(input);
  }

  static getThinkingText(): string {
    return this.thinkingPhrases[Math.floor(Math.random() * this.thinkingPhrases.length)];
  }

  static getInputPlaceholder(mode: string): string {
    switch (mode) {
      case 'chat':
        return "Ask Randy anything about MCP or just chat!";
      case 'request-response':
        return "Describe what you want Randy to help you build or analyze...";
      case 'playground':
        return "Experiment with Randy's capabilities!";
      default:
        return "Talk to Randy!";
    }
  }

  private static getRandomQuote(): string {
    return this.randyQuotes[Math.floor(Math.random() * this.randyQuotes.length)];
  }

  private static getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static getMCPAdvice(): string {
    const advice = [
      "We can search through data, add new items, or even explore the server's capabilities!",
      "Let's try running some MCP tools and see what happens!",
      "Want to see what tools this server has? Just ask!",
      "We can do all sorts of cool stuff with this connection!"
    ];
    return advice[Math.floor(Math.random() * advice.length)];
  }

  private static getConnectionHelp(): string {
    const help = [
      "Use the connection panel above to connect to a server like pocket-pick!",
      "Check out the MCP examples in the sidebar to get started!",
      "Try connecting to a local server or use one of our demo servers!",
      "The playground is perfect for testing connections!"
    ];
    return help[Math.floor(Math.random() * help.length)];
  }

  private static getHelpResponse(): string {
    return `${this.getRandomQuote()} I'm here to help you with MCP servers! I can:
    
• Connect to and interact with MCP servers
• Show you how to build your own servers in Go or JavaScript  
• Demonstrate live examples with real data
• Help troubleshoot connection issues
• Generate MCP server code
• Explain concepts with interactive examples

What specific thing would you like to explore?`;
  }

  private static getContextualResponse(input: string): string {
    if (input.includes('build') || input.includes('create')) {
      return "Let's build something awesome! I can help you create MCP servers or connect to existing ones!";
    }
    if (input.includes('learn') || input.includes('understand')) {
      return "Learning is the best! I love explaining things. What would you like to understand better?";
    }
    if (input.includes('demo') || input.includes('example')) {
      return "Demos are my favorite! Check out the interactive examples in the sidebar!";
    }
    return "Tell me more about what you're trying to do and I'll help you out!";
  }
}