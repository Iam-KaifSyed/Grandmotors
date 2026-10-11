import React from "react"

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, children, ...props },
  ref,
) {
  return (
    <a ref={ref} href={href} {...props}>
      {children}
    </a>
  )
})

export default Link
