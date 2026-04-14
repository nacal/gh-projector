export async function getToken(host: string): Promise<string> {
  const args = ['auth', 'token']
  if (host && host !== 'github.com') {
    args.push('-h', host)
  }
  const proc = Bun.spawn(['gh', ...args], { stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) {
    throw new Error(
      `Failed to get token from gh for host "${host}". Run \`gh auth login${
        host !== 'github.com' ? ` -h ${host}` : ''
      }\` first.\n${stderr.trim()}`,
    )
  }
  const token = stdout.trim()
  if (!token) throw new Error(`Empty token from gh for host "${host}"`)
  return token
}
