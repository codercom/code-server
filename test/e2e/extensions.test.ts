import { CODE_SERVER_ADDRESS, storageState } from "../utils/constants"
import { test } from "./baseFixture"

test.describe("Extensions", () => {
  test.use({
    storageState,
  })

  // This will only work if the test extension is loaded into code-server.
  test("should have access to VSCODE_PROXY_URI", async ({ codeServerPage }) => {
    await codeServerPage.runCommandFromPalette("code-server: Get proxy URI")

    await codeServerPage.page.isVisible(`text=${CODE_SERVER_ADDRESS}/proxy/{port}`)
  })
})
