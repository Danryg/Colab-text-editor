package main

import (
    "log"
    "net/http"
	"fmt"
    "github.com/gorilla/websocket"
    "strings"
    "strconv"
    "time"
    "os"
)





type file struct {
    id   string
    name string
    components []string
    path string
}

var files []file = []file{}





var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

var clients = make(map[string]*websocket.Conn) // connected clients
var number int = 0


func broadcastMessage(messagetype int, senderID string, message []byte) {
    for clientID, conn := range clients {
        if clientID != senderID {
            err := conn.WriteMessage(websocket.TextMessage, message)
            if err != nil {
                // Handle the error, e.g., log it or manage client disconnection
            }
        }
    }
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	log.Println("handleConnections")
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Fatal(err)
        return
    }
    
	number = number + 1
	uniqueID := fmt.Sprintf("%d", number)
	clients[uniqueID] = conn

    

    // Your application-specific logic for handling WebSocket messages
    go handleClient(conn, uniqueID)
}

func broadcastComponentChange(conn *websocket.Conn, fileID string, componentNumber int, component string, senderID string) {
    typeByte := []byte("3")
    message := append(typeByte, []byte("|&$")...)
    message = append(message, []byte(fileID)...)
    message = append(message, []byte("|&$")...)
    message = append(message, []byte(strconv.Itoa(componentNumber))...)
    message = append(message, []byte("|&$")...)
    message = append(message, []byte(component)...)


    for clientID, conn := range clients {
        if clientID != senderID{
            err := conn.WriteMessage(websocket.TextMessage, message)
            if(err != nil) {
                fmt.Println("Error writing to socket: ", err)
            }
        }
    }
}


func broadcastAddRow(conn *websocket.Conn, fileID string, row int, senderID string) {
    typeByte := []byte("4")
    message := append(typeByte, []byte("|&$")...)
    message = append(message, []byte(fileID)...)
    message = append(message, []byte("|&$")...)
    message = append(message, []byte(strconv.Itoa(row))...)
    
    

    for clientID, conn := range clients {
        if clientID != senderID{
            err := conn.WriteMessage(websocket.TextMessage, message)
            if(err != nil) {
                fmt.Println("Error writing to socket: ", err)
            }
        }
    }
}



func broadcastFiles(conn *websocket.Conn) {
    for _, file := range files {
        typeByte := []byte("1")
        message := append(typeByte, []byte("|&$")...)
        message = append(message, []byte(file.id)...)
        message = append(message, []byte("|&$")...)
        message = append(message, []byte(file.name)...)
        message = append(message, []byte("|&$")...)
        
        for _, component := range file.components {
            message = append(message, []byte(component)...)
            message = append(message, []byte("|&$")...)
        }
       
        
        err := conn.WriteMessage(websocket.TextMessage, message)
        if err != nil {
            // Handle the error, e.g., log it or manage client disconnection
            fmt.Println("Error writing to socket: ", err)
        }
    }

}

func broadcastRemoveRow(conn *websocket.Conn, fileID string, row int, senderID string) {
    typeByte := []byte("5")
    message := append(typeByte, []byte("|&$")...)
    message = append(message, []byte(fileID)...)
    message = append(message, []byte("|&$")...)
    message = append(message, []byte(strconv.Itoa(row))...)
    
    

    for clientID, conn := range clients {
        if clientID != senderID{
            err := conn.WriteMessage(websocket.TextMessage, message)
            if(err != nil) {
                fmt.Println("Error writing to socket: ", err)
            }
        }
    }
}



func handleClient(conn *websocket.Conn, clientID string) {
	log.Printf("handleClient %s", clientID)
	defer conn.Close()

    broadcastFiles(conn)

    for {
		log.Printf("Reading from %s", clientID)
        messageType, p, err := conn.ReadMessage()
        if err != nil {
            // Handle disconnection and remove the client from the data structure
			log.Printf("Error reading from %s", err)
            delete(clients, clientID)
            return
        }
        fmt.Printf("Message received: %s\n", p)

        fmt.Println(strings.Split(string(p), "|&$"))
        tokens := strings.Split(string(p), "|&$");
        if(tokens[0] == "1") {
            if(len(tokens) >= 3) {
                addFile(file{id: tokens[1], name: tokens[2], components: tokens[3:len(tokens)-1]})
            } else{
                addFile(file{id: tokens[1], name: tokens[2], components: []string{}})
            }
            broadcastFiles(conn)
        } else if(tokens[0] == "2") {
            
        } else if(tokens[0] == "3") {
            fmt.Println("Edit file: ")
            for i, tempFile := range files {
                if(tempFile.id == tokens[1]) {
                    num, err := strconv.Atoi(tokens[2])
                    if(err != nil) {
                        fmt.Println("Error converting string to int: ", err)
                    }
                    tempFile.components[num] = tokens[3]
                    files[i] = tempFile
                }
            }
            num, err := strconv.Atoi(tokens[2])
            if(err != nil) {
                fmt.Println("Error converting string to int: ", err)
            }
            broadcastComponentChange(conn, tokens[1],num , tokens[3], clientID)
        } else if(tokens[0] == "4") {
            fmt.Println("add row: ")
            num, err := strconv.Atoi(tokens[2])
            if err != nil {
                fmt.Println("Error converting string to int: ", err)
            }
            for i, tempFile := range files {
                if(tempFile.id == tokens[1]) {
                    tempFile.components = append(tempFile.components[:num + 1], append([]string{""}, tempFile.components[num + 1:]...)...)
                    files[i] = tempFile
                }
            }
            broadcastAddRow(conn, tokens[1], num, clientID)
        } else if(tokens[0] == "5") {
            fmt.Println("delete row: ")
            num, err := strconv.Atoi(tokens[2])
            
            if(err !=  nil) {
                fmt.Println("Error converting string to int: ", err)
                
            }

            for i, tempFile := range files {
                if(tempFile.id == tokens[1]) {
                    tempFile.components = append(tempFile.components[:num], tempFile.components[num + 1:]...)
                    files[i] = tempFile
                }
            }
            broadcastRemoveRow(conn, tokens[1], num, clientID)
        }


        fmt.Println("Message received: ", messageType)
        // Process the received message
        // Broadcast the message to all other clients
        
    }
}

func addFile(inFile file) {
    files = append(files, inFile)
}


func writeFilesToDisk() {
    for _, file := range files {
        content := strings.Join(file.components, "\n")
        path := "fs/" + file.name
        err := os.WriteFile(path, []byte(content), 0644)
        if err != nil {
            fmt.Println("Error writing to file:", err)
        }
    }
}


func main() {
    http.HandleFunc("/ws", handleConnections)

    ticker := time.NewTicker(20 * time.Second)

    files,err := os.ReadDir("fs")
    if err != nil {
        log.Fatal(err)
    }
    for _, tempFile := range files {
        content, err := os.ReadFile("fs/" + tempFile.Name())
        if err != nil {
            fmt.Println("Error reading file:", err)
        }
        addFile(file{id: tempFile.Name(), name: tempFile.Name(), components: strings.Split(string(content), "\n")})
    }


    go func() {
        for {
            select {
            case <-ticker.C:
                writeFilesToDisk()
            }
        }
    }()
    go func() {
        log.Fatal(http.ListenAndServe(":8080", nil))
    }()

    log.Println("Server is running on :8080")
    select {}
}
