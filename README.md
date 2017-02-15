#Nobel

Nobel is an abbreviation of notification + bell. The purpose of this app is to allow IMG members to ping the sound enabled computer in IMG Lab to start a chat with the members present there.

This eliminates the hassle of having to call multiple people to know who is in the lab at any given time.

##How it works

- An IMG member opens https://channeli.in/nobel/
- The request passes through checks that validate the person's membership in IMG
- Some encryption, forwarding, decryption and more validation occurs and when 100% convinced that the request is an IMGian, the request reaches a Node.js server in the lab.
- A song is played in the lab to draw attention and a chat opens between the caller and the IMG computer.
- Talk to your heart's content!

A bit vague, is it? Deal with it.

##Untracked files

<pre>
nobel
|
+---server-side-static
|   |
|   +--+notification-audio.mp3  #The audio that plays on the lab PC
|
+---client-side-static
|   |
|   +--+bell.mp3                #The ding that plays when message arrives
|
+---constants.js                #Sensitive information constants
</pre>

