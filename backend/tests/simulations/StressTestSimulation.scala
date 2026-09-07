package stressforge

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class StressTestSimulation extends Simulation {

  val targetUrl = System.getProperty("targetUrl", "http://localhost:8080/api/status")
  val concurrency = System.getProperty("concurrency", "1").toInt
  val duration = System.getProperty("duration", "10").toInt

  val httpProtocol = http
    .baseUrl(targetUrl)
    .acceptHeader("text/html,application/json")
    .userAgentHeader("StressForge-Gatling")

  val scn = scenario("Stress Test")
    .exec(http("request").get("/"))

  setUp(
    scn.inject(
      rampUsers(concurrency).during(duration.seconds)
    )
  ).protocols(httpProtocol)
}
