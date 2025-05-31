---
title: Writing a hello world program in assembly
date: 2025-05-05
author: Adenosine
---
In this post, I will be going through how you would write a simple hello
world program in [FASM](https://flatassembler.net/) for Linux.

Note: This post (and the entire blog) is licensed under [GPLv3 License](https://www.gnu.org/licenses/gpl-3.0.en.html)
and is hosted on [GitHub](https://github.com/doomed-neko/website)

## Set up

First of all, download and install [Flat Assembler](https://flatassembler.net/).
On arch, you can install it using pacman as follows:

```bash
sudo pacman -S fasm
```

Next you will need to create a directory for this project containing our `main.s`
file, you can use `mkdir` and `touch` for that.

```bash
mkdir asm_hello
cd asm_hello
touch main.s
```

and now we're ready to get our hands dirty!

## Hello World

Now for the assembly part, first of all we need to understand how assembly
communicates with the system.

It is done via what is called System Calls (or syscalls for short), functions
that tell the operating system what to do with the hardware, like reading a file
or writing to it. And unlike normal languages where you supply arguments (or parameters)
to your functions, in assembly we have [registers](https://en.wikipedia.org/wiki/Processor_register).

In this post, we'll be working with 64 bit assembly, different architectures
might use registers different from what you'll be seeing here.

### syscalls

To write a simple hello world program in assembly, first we'll need
to find the number for the `Write` syscall, I like using
[this table](https://chromium.googlesource.com/chromiumos/docs/+/master/constants/syscalls.md#tables)
as a reference for syscalls, we can see that the `Write` syscall is number 1,
let's keep that in mind.

As we can see from the table, `Write` takes 3 arguments:

1. `fd`: The id of the file to write to.
2. `buf`: A pointer to the buffer which contains the text to be written to the file.
3. `count`: Number of bytes to read from the buffer.

In Linux everything is a file, including stdout. Some files have a constant
[File Descriptors](https://en.wikipedia.org/wiki/File_descriptor)
like stdin(0), stdout(1) and stderr(2).

To print text to the screen we will be writing to stdout, using the `Write` syscall.
Now we have the number of the syscall we need and the file descriptor,
all that's left is to just define some text, which is what we'll do now

### writing your first piece of assembly

Open `main.s` in your favourite editor and let's start with some boilerplate.

```nasm
format ELF64 executable

segment readable executable
entry main
main:

segment readable writable

```

In the first line, we defined that our code should be compiled to
[ELF](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format) format.

Next, we defined a segment that can be read and executed by the operating system,
inside this segment lies our entry point, them `main` section

After that, we defined a writable section in which we'll store our variables.

```nasm
...
segment readable writable
msg db "Hello World", 10
msg_len = $ - msg
```

Alright now this might seem weird to you, but it is really simple.

We defined a variable called `msg` using the `db` keyword which stands for
`define byte`, there are other sizes you can use as well but this fits our uses
for now.

And then to calculate then size of this string, we used the dollar sign `$` which
represents the current memory position, and subtracted the start address of `msg`,
this returns the exact size of `msg`, now we have all the puzzle pieces!

### calling a syscall

To tell the system which syscall you want, you "move" it's number into the
`rax` register.
We can do that like so:

```nasm
...
segment readable executable
entry main
main:
  mov rax, 1 ;; 1 is the number of Write syscall
```

As you can see, we used the `mov` instruction to move a value into a register.
We first specify the target register and then the value.

Now to specify the arguments.

Here in 64bit assembly, we use the `rdi`, `rsi`, `rdx`, `r10`, `r9`, etc
registers to specify arguments.

```nasm
...
segment readable executable
entry main
main:
  mov rax, 1 ;; 1 is the number of Write syscall

  mov rdi, 1 ;; the file descriptor for STDOUT
  mov rsi, msg
  mov rdx, msg_len
  syscall

...
```

Now we that we have all the arguments set, we use the `syscall` instruction
to notify the operating system and execute the requested syscall.

So the final code would look like this:

```nasm
format ELF64 executable
segment readable executable
entry main
main:
  mov rax, 1 ;; 1 is the number of Write syscall

  mov rdi, 1 ;; the file descriptor for STDOUT
  mov rsi, msg
  mov rdx, msg_len
  syscall

segment readable writable
msg db "Hello World", 10
msg_len = $ - msg
```

Now we'll compile our code using `fasm`:

```bash
fasm ./moain.s
```

`fasm` produces a binary file, we need to set is as an executable file as so:

```bash
chmod +x ./main
```

Et voila! Now run your binary and see as it prints the message:

![Image file showing the binary printing hello world and SEGFAULT'ing](/img/asm-hello-1.png)

It works, but segfaults for some reason. That's because we never told
the OS what to do after printing, usually languages do this for you automatically
but here in assembly, you have to tell the system to exit manually.

### Exiting

If we go back to the syscalls table and search for `exit`, we can see that it's
number 60, we need to call this syscall to exit correctly.

It's not very different from the previous section, and this syscall only
takes one argument, which is the [exit status](https://en.wikipedia.org/wiki/Exit_status)

```nasm
...
  mov rax, 60 ;; the number of Exit syscall

  mov rdi, 0 ;; EXIT_SUCCESS
  syscall
...
```

Now if we recompile, our program exits without any errors:
![Hello world program exiting successfully](/img/asm-hello-2.png)

Alright! Now we have wrote our first assembly program.
