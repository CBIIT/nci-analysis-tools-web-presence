import static junit.framework.Assert.assertEquals;
import static junit.framework.Assert.assertTrue;
import java.util.concurrent.TimeUnit;
import java.io.IOException;

import org.junit.Test;
import org.junit.AfterClass;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class TestICRPWebsite {

    @Test
    public void shouldAssertTrue() {
        assertTrue("The primitive value true should equal true", true);
    }

    @Test
    public void shouldBePubliclyAccessible() {
        String websiteUrl =
            System.getProperty("website.url");
        WebDriver browser = new FirefoxDriver();

        browser.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
        browser.get(websiteUrl);

        assertEquals(
            websiteUrl,
            browser.getCurrentUrl());

        browser.close();
    }
}