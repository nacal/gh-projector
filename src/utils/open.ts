export async function openUrl(url: string): Promise<void> {
  const platform = process.platform
  const cmd =
    platform === 'darwin'
      ? ['open', url]
      : platform === 'win32'
        ? ['cmd', '/c', 'start', '""', url]
        : ['xdg-open', url]
  const proc = Bun.spawn(cmd, { stdout: 'ignore', stderr: 'ignore' })
  await proc.exited
}
