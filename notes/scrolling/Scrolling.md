# Implementing Synchronized 2D Scrolling

[This Codesandbox Example](https://codesandbox.io/p/sandbox/synchronize-scrolling-in-multiple-divs-with-overflow-8wvi7)
shows how to set up 2D scrolling with synchronized horizontal and vertical side bars. We will employ this design
for the arrangement view and the piano roll/drum grid views.

Scrolling is propagated across `div` elements using an `onScroll` handler, which sets the scroll value on the
other affected panels. There is also a toggle value `_preventEvent`, which surpressing responding to a scroll event.

For improved usability, we may consider using a virtual scroll bar as described in this blog post:
[Copying Slack's Brilliant Virtual Scrollbar And Overflow Container In Angular 9.1.12](https://www.bennadel.com/blog/3864-copying-slacks-brilliant-virtual-scrollbar-and-overflow-container-in-angular-9-1-12.htm).