export async function copyToClipboard(text: string): Promise<void> {
  const platform = process.platform
  const cmd =
    platform === 'darwin'
      ? ['pbcopy']
      : platform === 'win32'
        ? ['clip']
        : ['xclip', '-selection', 'clipboard']
  const proc = Bun.spawn(cmd, { stdin: 'pipe', stdout: 'ignore', stderr: 'ignore' })
  proc.stdin.write(text)
  proc.stdin.end()
  await proc.exited
}
