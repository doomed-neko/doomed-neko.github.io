---
title: Writing an http server in assembly
date: 2025-05-09
author: Adenosine
---

Last Post, we wrote a very simple hello world program in assembly which does
nothing other than printing `Hello World\n` and exiting.

Today, we'll level up and write a simple static http server, so let's get going

## Syscalls we will use

We will be using some syscalls to work with sockets and file descriptors, but we
will need some macros as well.

### First: macro set up

`socket` is the syscall used to open a socket (duh) and assign a file descriptor
to it, In the [syscalls table](https://chromium.googlesource.com/chromiumos/docs/+/master/constants/syscalls.md#tables)
we can see it has the number `41` and it takes three arguments:

```c
#include <sys/socket.h>
int socket(int domain, int type, int protocol);
```

To learn more about each argument you can see [the man page](https://man7.org/linux/man-pages/man2/socket.2.html),
for now we will set the arguments as follows:

```nasm
;; initialize a socket
mov rax, 41
mov rdi, 2
mov rsi, 1
mov rdx, 0
syscall


```

<sup>Remember to specify the format and segments, for more info check
[the previous post](/posts/asm-helloworld/)</sup>

In 64bit assembly, most calls return the end value to `rax`, that's where our
file descriptor should be, but if for some reason the call failed. The value
in `rax` will be negative, we can use the `jl` instruction to jump to another
label if the value is less than zero, and handle an error by exiting. Otherwise
the syscall is successful and we can move the file descriptor to a variable

```nasm
...
  cmp rax, 0
  jl error
  mov sockfd, rax


error:
  mov rax, 60
  mov rdi, 1
  syscall

segment readable writable
sockfd dq -1
```

We initialize the `sockfd` variable with a negative value to make sure that if
something bad happens, the file descriptor stays invalid and won't affect us
when using the `close` syscall.

But do you notice that our code is a bit too verbose? We can fix that by defining
fasm macros!

```nasm
macro socket domain, type, protocol{
  mov rax, 41
  mov rdi, domain
  mov rsi, type
  mov rdx, protocol
  syscall
}

macro exit code{
  mov rax, 60
  mov rdi, code
}
```

Now it is possible to call those syscalls in a much more readable way:

```nasm
entry main
main:
  socket 2, 1, 0
  cmp rax, 0
  jl error
  mov sockfd, rax
  exit 0 ;; exit SUCCESS

error: 
  exit 1 ;; exit FAIL

segment readable writable
sockfd dq -1

```

Perfect! We can keep on creating those macros to make our code more readable,
we can create a macro for each type of syscall, but we can create a macro for that
as well!

```nasm
SYS_read   equ 0
SYS_write  equ 1
SYS_close  equ 3
SYS_socket equ 41
SYS_accept equ 43
SYS_bind   equ 49
SYS_listen equ 50
SYS_exit   equ 60

macro syscall1 name, a{
    mov rax, name
    mov rdi, a
    syscall
}
macro syscall2 name, a,b{
    mov rax, name
    mov rdi, a
    mov rsi, b
    syscall
}
macro syscall3 name, a,b,c{
    mov rax, name
    mov rdi, a
    mov rsi, b
    mov rdx, c
    syscall
}

macro write fd, buf, len{
  syscall3 SYS_write, fd, buf, len
}

macro read fd, buf, len{
  syscall3 SYS_read, fd, buf, len
}

macro socket domain, type, protocol{
  syscall3 SYS_socket, domain, type, protocol
}

macro bind sockfd, addr, size{
  syscall3 SYS_bind, sockfd, addr, size
}

macro listen sockfd, backlog{
    syscall2 SYS_listen, sockfd, backlog
}

macro accept sockfd, addr, addr_len{
  syscall3 SYS_accept, sockfd, addr, addr_len
}

macro exit code{
  syscall1 SYS_exit, code
}

macro close fd{
  syscall1 SYS_close, fd
}
```

We also defined constants for the number of each syscall we're using, our code
is more readable now, so we can go with writing the actual server

###
